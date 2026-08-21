using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPostgreSqlReportingObjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR REPLACE VIEW "Reporting"."vw_OrganizationKpis" AS
                SELECT o."OrganizationId", o."Name" AS "OrganizationName",
                       COUNT(DISTINCT s."StationId")::integer AS "TotalStations",
                       COUNT(DISTINCT CASE WHEN s."Status" = 'ONLINE' THEN s."StationId" END)::integer AS "OnlineStations",
                       COUNT(DISTINCT CASE WHEN s."Status" = 'OFFLINE' THEN s."StationId" END)::integer AS "OfflineStations",
                       COUNT(DISTINCT CASE WHEN a."Status" IN ('ACTIVE','ACKNOWLEDGED') THEN a."AlarmId" END)::integer AS "OpenAlarms",
                       COUNT(DISTINCT CASE WHEN a."Status" IN ('ACTIVE','ACKNOWLEDGED') AND a."Severity" = 'CRITICAL' THEN a."AlarmId" END)::integer AS "CriticalAlarms",
                       COUNT(DISTINCT CASE WHEN a."Status" IN ('ACTIVE','ACKNOWLEDGED') AND a."Severity" = 'WARNING' THEN a."AlarmId" END)::integer AS "WarningAlarms"
                FROM "Platform"."Organization" o
                LEFT JOIN "Core"."Station" s ON s."OrganizationId" = o."OrganizationId" AND s."IsActive" = TRUE
                LEFT JOIN "Operations"."Alarm" a ON a."OrganizationId" = o."OrganizationId"
                GROUP BY o."OrganizationId", o."Name";

                CREATE OR REPLACE VIEW "Reporting"."vw_CurrentTelemetry" AS
                WITH latest AS (
                    SELECT mc.*, ROW_NUMBER() OVER (PARTITION BY mc."StationId", mc."ParameterId" ORDER BY mc."TimestampUtc" DESC, mc."MeasurementCleanId" DESC) AS rn
                    FROM "Telemetry"."MeasurementClean" mc WHERE mc."QualityFlag" <> 'QUARANTINED'
                )
                SELECT s."OrganizationId", s."StationId", s."StationCode", s."Name" AS "StationName",
                       p."ParameterId", p."Code" AS "ParameterCode", p."Name" AS "ParameterName",
                       p."CanonicalUnit", latest."TimestampUtc", latest."Value", latest."QualityFlag", latest."IsInterpolated"
                FROM latest JOIN "Core"."Station" s ON s."StationId" = latest."StationId"
                JOIN "Core"."Parameter" p ON p."ParameterId" = latest."ParameterId" WHERE latest.rn = 1;

                CREATE OR REPLACE VIEW "Reporting"."vw_DataQualityLatest" AS
                WITH latest AS (
                    SELECT d.*, ROW_NUMBER() OVER (PARTITION BY d."StationId" ORDER BY d."WindowEndUtc" DESC, d."DataQualityLogId" DESC) AS rn
                    FROM "Telemetry"."DataQualityLog" d
                )
                SELECT latest."OrganizationId", latest."StationId", s."StationCode", s."Name" AS "StationName",
                       latest."WindowStartUtc", latest."WindowEndUtc", latest."TotalCount", latest."ValidCount",
                       latest."InterpolatedCount", latest."QuarantinedCount", latest."DuplicateCount",
                       latest."ValidPct", latest."InterpolatedPct", latest."QuarantinedPct",
                       latest."SchemaDriftEvents", latest."RulesetVersion"
                FROM latest JOIN "Core"."Station" s ON s."StationId" = latest."StationId" WHERE latest.rn = 1;

                CREATE OR REPLACE VIEW "Reporting"."vw_ActiveAlarms" AS
                SELECT a."OrganizationId", a."AlarmId", a."StationId", s."StationCode", s."Name" AS "StationName",
                       r."Name" AS "RegionName", at."Code" AS "AlarmType", at."Name" AS "AlarmTypeName",
                       a."ParameterId", p."Code" AS "ParameterCode", a."Severity", a."Status", a."Message",
                       a."ValueAtRaise", a."ThresholdValue", a."RaisedAtUtc", a."AcknowledgedAtUtc",
                       u."DisplayName" AS "AcknowledgedBy",
                       EXTRACT(EPOCH FROM (COALESCE(a."AcknowledgedAtUtc", timezone('utc', now())) - a."RaisedAtUtc"))::integer / 60 AS "MinutesToAcknowledge"
                FROM "Operations"."Alarm" a JOIN "Core"."Station" s ON s."StationId" = a."StationId"
                LEFT JOIN "Core"."Region" r ON r."RegionId" = s."RegionId"
                JOIN "Operations"."AlarmType" at ON at."AlarmTypeId" = a."AlarmTypeId"
                LEFT JOIN "Core"."Parameter" p ON p."ParameterId" = a."ParameterId"
                LEFT JOIN "Security"."User" u ON u."UserId" = a."AcknowledgedByUserId"
                WHERE a."Status" IN ('ACTIVE','ACKNOWLEDGED');

                CREATE OR REPLACE VIEW "Reporting"."vw_StationDirectory" AS
                SELECT s."OrganizationId", o."Name" AS "OrganizationName", r."RegionId", r."Name" AS "RegionName",
                       s."StationId", s."StationCode", s."Name" AS "StationName", s."Status", s."Latitude", s."Longitude",
                       s."LastSeenAtUtc", COUNT(DISTINCT sp."ParameterId")::integer AS "EnabledParameterCount",
                       COUNT(DISTINCT CASE WHEN a."Status" IN ('ACTIVE','ACKNOWLEDGED') THEN a."AlarmId" END)::integer AS "OpenAlarmCount",
                       COUNT(DISTINCT CASE WHEN a."Status" IN ('ACTIVE','ACKNOWLEDGED') AND a."Severity" = 'CRITICAL' THEN a."AlarmId" END)::integer AS "CriticalAlarmCount"
                FROM "Core"."Station" s JOIN "Platform"."Organization" o ON o."OrganizationId" = s."OrganizationId"
                LEFT JOIN "Core"."Region" r ON r."RegionId" = s."RegionId"
                LEFT JOIN "Core"."StationParameter" sp ON sp."StationId" = s."StationId" AND sp."IsEnabled" = TRUE
                LEFT JOIN "Operations"."Alarm" a ON a."StationId" = s."StationId" WHERE s."IsActive" = TRUE
                GROUP BY s."OrganizationId", o."Name", r."RegionId", r."Name", s."StationId", s."StationCode",
                         s."Name", s."Status", s."Latitude", s."Longitude", s."LastSeenAtUtc";

                CREATE OR REPLACE VIEW "Reporting"."vw_ModelHealth" AS
                SELECT m."OrganizationId", m."ModelId", m."ModelType", m."StationId", s."StationCode",
                       m."ParameterId", p."Code" AS "ParameterCode", m."Version", m."Status", m."TrainedAtUtc",
                       m."PromotedAtUtc", m."FeatureSetVersion", m."CleaningRulesetVersion", m."MetricsJson",
                       COUNT(tr."TrainingRunId")::integer AS "TrainingRunCount", MAX(tr."FinishedAtUtc") AS "LastTrainingFinishedAtUtc"
                FROM "AI"."MlModel" m LEFT JOIN "Core"."Station" s ON s."StationId" = m."StationId"
                LEFT JOIN "Core"."Parameter" p ON p."ParameterId" = m."ParameterId"
                LEFT JOIN "AI"."MlTrainingRun" tr ON tr."ModelId" = m."ModelId"
                GROUP BY m."OrganizationId", m."ModelId", m."ModelType", m."StationId", s."StationCode", m."ParameterId",
                         p."Code", m."Version", m."Status", m."TrainedAtUtc", m."PromotedAtUtc", m."FeatureSetVersion",
                         m."CleaningRulesetVersion", m."MetricsJson";

                CREATE OR REPLACE VIEW "Reporting"."vw_StationRiskLatest" AS
                WITH latest AS (
                    SELECT r.*, ROW_NUMBER() OVER (PARTITION BY r."OrganizationId", r."StationId", r."RegionId" ORDER BY r."ComputedAtUtc" DESC, r."RiskScoreId" DESC) AS rn
                    FROM "AI"."RiskScore" r
                )
                SELECT latest.*, s."StationCode", s."Name" AS "StationName", rg."Name" AS "RegionName"
                FROM latest LEFT JOIN "Core"."Station" s ON s."StationId" = latest."StationId"
                LEFT JOIN "Core"."Region" rg ON rg."RegionId" = latest."RegionId" WHERE latest.rn = 1;

                CREATE OR REPLACE FUNCTION "Reporting"."ufn_StationMeasurements"(
                    p_station_id uuid, p_parameter_id integer, p_from_utc timestamptz, p_to_utc timestamptz,
                    p_include_interpolated boolean DEFAULT TRUE
                ) RETURNS TABLE(
                    "MeasurementCleanId" bigint, "StationId" uuid, "StationCode" text, "StationName" text,
                    "ParameterId" integer, "ParameterCode" text, "ParameterName" text, "TimestampUtc" timestamptz,
                    "Value" numeric, "CanonicalUnit" text, "QualityFlag" text, "IsInterpolated" boolean
                ) LANGUAGE sql STABLE AS $$
                    SELECT mc."MeasurementCleanId", mc."StationId", s."StationCode", s."Name",
                           mc."ParameterId", p."Code", p."Name", mc."TimestampUtc", mc."Value",
                           mc."CanonicalUnit", mc."QualityFlag", mc."IsInterpolated"
                    FROM "Telemetry"."MeasurementClean" mc JOIN "Core"."Station" s ON s."StationId" = mc."StationId"
                    JOIN "Core"."Parameter" p ON p."ParameterId" = mc."ParameterId"
                    WHERE mc."StationId" = p_station_id AND mc."ParameterId" = p_parameter_id
                      AND mc."TimestampUtc" >= p_from_utc AND mc."TimestampUtc" < p_to_utc
                      AND mc."QualityFlag" <> 'QUARANTINED' AND (p_include_interpolated OR NOT mc."IsInterpolated")
                $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP FUNCTION IF EXISTS "Reporting"."ufn_StationMeasurements"(uuid, integer, timestamptz, timestamptz, boolean);
                DROP VIEW IF EXISTS "Reporting"."vw_StationRiskLatest";
                DROP VIEW IF EXISTS "Reporting"."vw_ModelHealth";
                DROP VIEW IF EXISTS "Reporting"."vw_StationDirectory";
                DROP VIEW IF EXISTS "Reporting"."vw_ActiveAlarms";
                DROP VIEW IF EXISTS "Reporting"."vw_DataQualityLatest";
                DROP VIEW IF EXISTS "Reporting"."vw_CurrentTelemetry";
                DROP VIEW IF EXISTS "Reporting"."vw_OrganizationKpis";
                """);
        }
    }
}
