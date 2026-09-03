using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using WaterOperations.Infrastructure.Configuration;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Dahiti;

public sealed class DahitiSyncService(
    WaterOperationsDbContext db,
    IHttpClientFactory httpClientFactory,
    IOptions<DahitiOptions> options,
    ILogger<DahitiSyncService> logger)
{
    private readonly DahitiOptions settings = options.Value;

    public async Task SyncAsync(CancellationToken cancellationToken)
    {
        if (!settings.Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            logger.LogWarning("DaHITI sync is enabled but Dahiti:ApiKey is empty.");
            return;
        }

        await EnsureSchemaAsync(cancellationToken);
        var runId = await StartRunAsync(cancellationToken);
        try
        {
            var targets = await ResolveTargetsAsync(cancellationToken);
            var stationCount = 0;
            var readingCount = 0;

            foreach (var target in targets)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var response = await DownloadWaterLevelAsync(target.Id, cancellationToken);
                await UpsertTargetAsync(response, cancellationToken);
                readingCount += await UpsertReadingsAsync(response, cancellationToken);
                stationCount++;

                if (settings.RequestDelayMilliseconds > 0)
                {
                    await Task.Delay(settings.RequestDelayMilliseconds, cancellationToken);
                }
            }

            await FinishRunAsync(runId, "succeeded", stationCount, readingCount, null, cancellationToken);
            logger.LogInformation("DaHITI sync completed: {Stations} stations and {Readings} readings.", stationCount, readingCount);
        }
        catch (Exception exception)
        {
            await FinishRunAsync(runId, "failed", 0, 0, exception.Message, CancellationToken.None);
            logger.LogError(exception, "DaHITI sync failed.");
            throw;
        }
    }

    private async Task EnsureSchemaAsync(CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                create table if not exists public.dahiti_stations (
                  dahiti_id integer primary key, target_name text not null, target_type text not null,
                  country text not null default 'Egypt', continent text not null default 'Africa',
                  latitude double precision not null, longitude double precision not null,
                  profile jsonb not null default '{}'::jsonb, data_access jsonb not null default '{}'::jsonb,
                  source_url text not null, last_synced_at timestamptz, observation_count integer not null default 0,
                  first_observed_at timestamptz, last_observed_at timestamptz,
                  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
                );
                create table if not exists public.dahiti_water_levels (
                  dahiti_id integer not null references public.dahiti_stations(dahiti_id) on delete cascade,
                  observed_at timestamptz not null, wse double precision not null, uncertainty double precision,
                  source_record text, source_hash text, raw jsonb not null default '{}'::jsonb,
                  imported_at timestamptz not null default now(), primary key (dahiti_id, observed_at)
                );
                create unique index if not exists ux_dahiti_water_levels_source_hash on public.dahiti_water_levels (source_hash) where source_hash is not null;
                create or replace view public.dahiti_station_latest as
                  select distinct on (w.dahiti_id) w.dahiti_id, w.observed_at, w.wse, w.uncertainty, w.source_record
                  from public.dahiti_water_levels w order by w.dahiti_id, w.observed_at desc;
                create table if not exists public.dahiti_sync_runs (
                  id bigint generated always as identity primary key, started_at timestamptz not null default now(),
                  finished_at timestamptz, status text not null check (status in ('running', 'succeeded', 'failed')),
                  station_count integer not null default 0, reading_count integer not null default 0, error_message text
                );
                """;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private async Task<IReadOnlyList<DahitiTarget>> ResolveTargetsAsync(CancellationToken cancellationToken)
    {
        var configuredIds = settings.StationIdsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => int.TryParse(value, CultureInfo.InvariantCulture, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .Select(id => new DahitiTarget(id, null, null, null, null, null, null, default))
            .ToArray();

        if (configuredIds.Length > 0)
        {
            return configuredIds;
        }

        using var client = httpClientFactory.CreateClient("Dahiti");
        var payload = new Dictionary<string, object?> { ["api_key"] = settings.ApiKey };
        if (!string.IsNullOrWhiteSpace(settings.Country))
        {
            var country = settings.Country.Trim().ToLowerInvariant();
            if (country is "egypt" or "egy")
            {
                country = "eg";
            }
            payload["country"] = country;
        }

        using var response = await client.PostAsync("list-targets/", JsonContent(payload), cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        EnsureApiSuccess(document);

        return document.RootElement.GetProperty("data").EnumerateArray()
            .Select(ReadTarget)
            .Where(target => target.Id > 0)
            .ToArray();
    }

    private async Task<DahitiResponse> DownloadWaterLevelAsync(int id, CancellationToken cancellationToken)
    {
        using var client = httpClientFactory.CreateClient("Dahiti");
        var payload = new { api_key = settings.ApiKey, dahiti_id = id, format = "json" };
        using var response = await client.PostAsync("download-water-level/", JsonContent(payload), cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        EnsureApiSuccess(document);
        return ReadResponse(document);
    }

    private async Task UpsertTargetAsync(DahitiResponse response, CancellationToken cancellationToken)
    {
        var target = response.Target;
        await db.Database.OpenConnectionAsync(cancellationToken);
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            insert into public.dahiti_stations
              (dahiti_id, target_name, target_type, country, continent, latitude, longitude, profile, data_access, source_url, last_synced_at, updated_at)
            values (@id, @name, @type, @country, @continent, @lat, @lon, @profile::jsonb, @access::jsonb, @url, now(), now())
            on conflict (dahiti_id) do update set
              target_name = excluded.target_name, target_type = excluded.target_type,
              country = excluded.country, continent = excluded.continent,
              latitude = excluded.latitude, longitude = excluded.longitude,
              profile = excluded.profile, data_access = excluded.data_access,
              source_url = excluded.source_url, last_synced_at = now(), updated_at = now();
            """;
        Add(command, "id", target.Id);
        Add(command, "name", target.Name ?? $"DaHITI target {target.Id}");
        Add(command, "type", target.Type ?? "Water body");
        Add(command, "country", target.Country ?? settings.Country);
        Add(command, "continent", target.Continent ?? "Africa");
        Add(command, "lat", target.Latitude ?? 0d);
        Add(command, "lon", target.Longitude ?? 0d);
        Add(command, "profile", JsonSerializer.Serialize(new { id = target.Id, name = target.Name, country = target.Country, continent = target.Continent, latitude = target.Latitude, longitude = target.Longitude }));
        Add(command, "access", JsonSerializer.Serialize(new { provider = "DAHITI", api = "v2", format = "json" }));
        Add(command, "url", "https://dahiti.dgfi.tum.de/api/v2/download-water-level/");
        await command.ExecuteNonQueryAsync(cancellationToken);
        await db.Database.CloseConnectionAsync();
    }

    private async Task<int> UpsertReadingsAsync(DahitiResponse response, CancellationToken cancellationToken)
    {
        if (response.Readings.Count == 0) return 0;
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                insert into public.dahiti_water_levels
                  (dahiti_id, observed_at, wse, uncertainty, source_record, source_hash, raw, imported_at)
                select @id, r.observed_at, r.wse, r.uncertainty, r.source_record, r.source_hash, r.raw, now()
                from jsonb_to_recordset(@readings::jsonb) as r(
                  observed_at timestamptz, wse double precision, uncertainty double precision,
                  source_record text, source_hash text, raw jsonb)
                on conflict (dahiti_id, observed_at) do update set
                  wse = excluded.wse, uncertainty = excluded.uncertainty,
                  source_record = excluded.source_record, source_hash = excluded.source_hash,
                  raw = excluded.raw, imported_at = now();
                """;
            Add(command, "id", response.Target.Id);
            Add(command, "readings", JsonSerializer.Serialize(response.Readings.Select(reading => new
            {
                observed_at = reading.ObservedAt,
                wse = reading.Wse,
                uncertainty = reading.Uncertainty,
                source_record = reading.SourceRecord,
                source_hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{response.Target.Id}|{reading.ObservedAt:O}|{reading.Wse:R}|{reading.Uncertainty:R}|{reading.SourceRecord}"))),
                raw = reading.Raw
            })));
            await command.ExecuteNonQueryAsync(cancellationToken);

            await using var summary = db.Database.GetDbConnection().CreateCommand();
            summary.CommandText = """
                update public.dahiti_stations s set
                  observation_count = (select count(*) from public.dahiti_water_levels w where w.dahiti_id = s.dahiti_id),
                  first_observed_at = (select min(observed_at) from public.dahiti_water_levels w where w.dahiti_id = s.dahiti_id),
                  last_observed_at = (select max(observed_at) from public.dahiti_water_levels w where w.dahiti_id = s.dahiti_id)
                where s.dahiti_id = @id;
                """;
            Add(summary, "id", response.Target.Id);
            await summary.ExecuteNonQueryAsync(cancellationToken);
            return response.Readings.Count;
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private async Task<long> StartRunAsync(CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = "insert into public.dahiti_sync_runs (status) values ('running') returning id;";
        var result = await command.ExecuteScalarAsync(cancellationToken);
        await db.Database.CloseConnectionAsync();
        return Convert.ToInt64(result, CultureInfo.InvariantCulture);
    }

    private async Task FinishRunAsync(long id, string status, int stations, int readings, string? error, CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = "update public.dahiti_sync_runs set finished_at = now(), status = @status, station_count = @stations, reading_count = @readings, error_message = @error where id = @id;";
        Add(command, "status", status); Add(command, "stations", stations); Add(command, "readings", readings); Add(command, "error", error); Add(command, "id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
        await db.Database.CloseConnectionAsync();
    }

    private static void Add(System.Data.Common.DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter(); parameter.ParameterName = $"@{name}"; parameter.Value = value ?? DBNull.Value; command.Parameters.Add(parameter);
    }

    private static StringContent JsonContent(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static void EnsureApiSuccess(JsonDocument document)
    {
        if (!document.RootElement.TryGetProperty("code", out var code))
        {
            if (document.RootElement.TryGetProperty("dahiti_id", out _) && document.RootElement.TryGetProperty("data", out _)) return;
            throw new InvalidOperationException("DaHITI API returned an unexpected response.");
        }
        if (code.GetInt32() != 200)
        {
            var message = document.RootElement.TryGetProperty("message", out var value) ? value.GetString() : "Unknown DaHITI error";
            throw new InvalidOperationException($"DaHITI API rejected the request: {message}");
        }
    }

    private static DahitiTarget ReadTarget(JsonElement item) => new(
        item.TryGetProperty("dahiti_id", out var id) ? id.GetInt32() : 0,
        GetString(item, "target_name"), GetString(item, "type"), GetString(item, "country"), GetString(item, "continent"), GetDouble(item, "latitude"), GetDouble(item, "longitude"), item.Clone());

    private static DahitiResponse ReadResponse(JsonDocument document)
    {
        var root = document.RootElement;
        var targetElement = root.TryGetProperty("target", out var nestedTarget) ? nestedTarget : root;
        var target = new DahitiTarget(
            targetElement.TryGetProperty("id", out var nestedId) ? nestedId.GetInt32() : targetElement.GetProperty("dahiti_id").GetInt32(),
            GetString(targetElement, "target_name"), GetString(targetElement, "type"), GetString(targetElement, "country"), GetString(targetElement, "continent"), GetDouble(targetElement, "latitude"), GetDouble(targetElement, "longitude"), targetElement.Clone());
        var readings = root.TryGetProperty("data", out var data) ? data.EnumerateArray().Select(item => new DahitiReading(
            DateTimeOffset.Parse(GetString(item, "date") ?? GetString(item, "datetime") ?? throw new InvalidOperationException("DaHITI reading has no timestamp."), CultureInfo.InvariantCulture),
            item.GetProperty("wse").GetDouble(), item.TryGetProperty("wse_u", out var uncertainty) ? uncertainty.GetDouble() : null, GetString(item, "data"), item.Clone())).ToArray() : [];
        return new DahitiResponse(target, readings);
    }

    private static string? GetString(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null ? value.GetString() : null;
    private static double? GetDouble(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null ? value.GetDouble() : null;

    private sealed record DahitiResponse(DahitiTarget Target, IReadOnlyList<DahitiReading> Readings);
    private sealed record DahitiTarget(int Id, string? Name, string? Type, string? Country, string? Continent, double? Latitude, double? Longitude, JsonElement Raw);
    private sealed record DahitiReading(DateTimeOffset ObservedAt, double Wse, double? Uncertainty, string? SourceRecord, JsonElement Raw);
}
