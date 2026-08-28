-- Promote the live DAHITI source tables into the platform read model.
-- Safe to re-run: station rows are upserted and readings are inserted only once.

begin;

insert into "Core"."Station" ("StationId","OrganizationId","RegionId","StationCode","Name","Description","Latitude","Longitude","Status","LastSeenAtUtc","CommunicationIntervalSeconds","MetadataJson","IsActive","CreatedAtUtc","UpdatedAtUtc")
select md5('dahiti:' || s.dahiti_id::text)::uuid,
       '11111111-1111-1111-1111-111111111111'::uuid,
       'c284f8d8-53e5-4f19-a518-ef3a3e482d59'::uuid,
       'DAHITI-' || s.dahiti_id::text,
       s.target_name,
       'DAHITI virtual station (' || s.target_type || ') - live source observations',
       s.latitude, s.longitude, 'ACTIVE', s.last_observed_at, 2592000,
       jsonb_build_object('source','DAHITI','dahiti_id',s.dahiti_id,'target_type',s.target_type,'source_url',s.source_url,'observation_count',s.observation_count)::text,
       true, now(), now()
from public.dahiti_stations s
on conflict ("StationId") do update set
  "Name"=excluded."Name", "Description"=excluded."Description", "Latitude"=excluded."Latitude", "Longitude"=excluded."Longitude",
  "LastSeenAtUtc"=excluded."LastSeenAtUtc", "MetadataJson"=excluded."MetadataJson", "UpdatedAtUtc"=now(), "IsActive"=true;

insert into "Core"."StationParameter" ("StationId","ParameterId","SourceUnit","IsEnabled","CalibrationOffset","CalibrationScale","InstalledAtUtc")
select md5('dahiti:' || s.dahiti_id::text)::uuid, 1, 'm', true, 0, 1, now()
from public.dahiti_stations s
on conflict ("StationId","ParameterId") do update set "SourceUnit"='m', "IsEnabled"=true;

insert into "Telemetry"."MeasurementClean" ("OrganizationId","StationId","ParameterId","TimestampUtc","Value","CanonicalUnit","QualityFlag","CleaningRulesetVersion","IsInterpolated","IsGapBoundary")
select '11111111-1111-1111-1111-111111111111'::uuid,
       md5('dahiti:' || w.dahiti_id::text)::uuid, 1, w.observed_at, w.wse, 'm', 'VALID', 'DAHITI_RAW_V1', false, false
from public.dahiti_water_levels w
where not exists (
  select 1 from "Telemetry"."MeasurementClean" m
  where m."StationId"=md5('dahiti:' || w.dahiti_id::text)::uuid
    and m."ParameterId"=1 and m."TimestampUtc"=w.observed_at
);

commit;
