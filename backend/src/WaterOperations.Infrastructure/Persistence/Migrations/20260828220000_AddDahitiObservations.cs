using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

[Migration("20260828220000_AddDahitiObservations")]
public partial class AddDahitiObservations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            create table if not exists public.dahiti_stations (
              dahiti_id integer primary key,
              target_name text not null,
              target_type text not null,
              country text not null default 'Egypt',
              continent text not null default 'Africa',
              latitude double precision not null,
              longitude double precision not null,
              profile jsonb not null default '{}'::jsonb,
              data_access jsonb not null default '{}'::jsonb,
              source_url text not null,
              last_synced_at timestamptz,
              observation_count integer not null default 0,
              first_observed_at timestamptz,
              last_observed_at timestamptz,
              created_at timestamptz not null default now(),
              updated_at timestamptz not null default now()
            );
            alter table public.dahiti_stations add column if not exists observation_count integer not null default 0;
            alter table public.dahiti_stations add column if not exists first_observed_at timestamptz;
            alter table public.dahiti_stations add column if not exists last_observed_at timestamptz;
            create table if not exists public.dahiti_water_levels (
              dahiti_id integer not null references public.dahiti_stations(dahiti_id) on delete cascade,
              observed_at timestamptz not null,
              wse double precision not null,
              uncertainty double precision,
              source_record text,
              source_hash text,
              raw jsonb not null default '{}'::jsonb,
              imported_at timestamptz not null default now(),
              primary key (dahiti_id, observed_at)
            );
            alter table public.dahiti_water_levels add column if not exists source_hash text;
            create index if not exists ix_dahiti_water_levels_station_time on public.dahiti_water_levels (dahiti_id, observed_at desc);
            create unique index if not exists ux_dahiti_water_levels_source_hash on public.dahiti_water_levels (source_hash) where source_hash is not null;
            create table if not exists public.dahiti_sync_runs (
              id bigint generated always as identity primary key,
              started_at timestamptz not null default now(),
              finished_at timestamptz,
              status text not null check (status in ('running', 'succeeded', 'failed')),
              station_count integer not null default 0,
              reading_count integer not null default 0,
              error_message text
            );
            create or replace view public.dahiti_station_latest as
              select distinct on (w.dahiti_id) w.dahiti_id, w.observed_at, w.wse, w.uncertainty, w.source_record
              from public.dahiti_water_levels w order by w.dahiti_id, w.observed_at desc;
            alter table public.dahiti_stations enable row level security;
            alter table public.dahiti_water_levels enable row level security;
            alter table public.dahiti_sync_runs enable row level security;
            drop policy if exists "public can read dahiti stations" on public.dahiti_stations;
            create policy "public can read dahiti stations" on public.dahiti_stations for select to anon, authenticated using (true);
            drop policy if exists "public can read dahiti water levels" on public.dahiti_water_levels;
            create policy "public can read dahiti water levels" on public.dahiti_water_levels for select to anon, authenticated using (true);
            drop policy if exists "authenticated can read dahiti sync runs" on public.dahiti_sync_runs;
            create policy "authenticated can read dahiti sync runs" on public.dahiti_sync_runs for select to authenticated using (true);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("drop view if exists public.dahiti_station_latest;");
        migrationBuilder.Sql("drop table if exists public.dahiti_sync_runs;");
        migrationBuilder.Sql("drop table if exists public.dahiti_water_levels;");
        migrationBuilder.Sql("drop table if exists public.dahiti_stations;");
    }
}
