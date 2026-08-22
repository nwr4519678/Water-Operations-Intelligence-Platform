using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Telemetry;

public sealed class EfMeasurementIngestionService(WaterOperationsDbContext db, ITenantContext tenant) : IMeasurementIngestionService
{
    public async Task<IngestionBatchResult> IngestAsync(IngestionBatchRequest request, CancellationToken cancellationToken)
    {
        if (request.Rows.Count is 0 or > 1000) throw new ArgumentOutOfRangeException(nameof(request.Rows), "A batch must contain between 1 and 1000 rows.");
        if (tenant.OrganizationId is not Guid organizationId) throw new UnauthorizedAccessException("A valid organization scope is required.");
        var overwrite = string.Equals(request.ConflictMode, "OVERWRITE", StringComparison.OrdinalIgnoreCase);
        if (!overwrite && !string.Equals(request.ConflictMode, "SKIP", StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("ConflictMode must be SKIP or OVERWRITE.", nameof(request.ConflictMode));
        if (await db.IngestionBatches.AnyAsync(batch => batch.IngestionBatchId == request.BatchId, cancellationToken))
            return new IngestionBatchResult(request.BatchId, 0, request.Rows.Count, 0,
                request.Rows.Select((_, index) => new IngestionRowOutcome(index, "DUPLICATE", "batch_already_processed", null)).ToList());

        var (ownedStations, bindings) = await LoadScopeAsync(request, organizationId, cancellationToken);
        var now = DateTime.UtcNow;
        var valid = request.Rows.Select((row, index) => new { row, index, reason = Validate(row, ownedStations, bindings, now) })
            .Where(x => x.reason is null).ToList();
        var selected = new Dictionary<(Guid StationId, int ParameterId, DateTime TimestampUtc), (IngestionRowRequest Row, int Index)>();
        var duplicateOutcomes = new Dictionary<int, IngestionRowOutcome>();
        foreach (var item in valid)
        {
            var key = (item.row.StationId, item.row.ParameterId, DateTime.SpecifyKind(item.row.TimestampUtc, DateTimeKind.Utc));
            if (!overwrite && selected.ContainsKey(key)) { duplicateOutcomes[item.index] = new IngestionRowOutcome(item.index, "DUPLICATE", "duplicate_in_batch", null); continue; }
            selected[key] = (item.row, item.index);
        }
        var keys = selected.Keys.ToArray();
        var stationIds = keys.Select(x => x.StationId).Distinct().ToArray();
        var parameterIds = keys.Select(x => x.ParameterId).Distinct().ToArray();
        var existingClean = await db.MeasurementCleans.Where(x => x.OrganizationId == organizationId && stationIds.Contains(x.StationId) && parameterIds.Contains(x.ParameterId)).Where(x => keys.Select(k => k.TimestampUtc).Contains(x.TimestampUtc)).ToListAsync(cancellationToken);
        foreach (var existing in existingClean)
        {
            var key = (existing.StationId, existing.ParameterId, existing.TimestampUtc);
            if (!selected.TryGetValue(key, out var item)) continue;
            if (overwrite) db.MeasurementCleans.Remove(existing);
            else { selected.Remove(key); duplicateOutcomes[item.Index] = new IngestionRowOutcome(item.Index, "DUPLICATE", "measurement_already_exists", null); }
        }
        var acceptedRows = selected.Values.OrderBy(x => x.Index).ToList();
        var batch = new IngestionBatch
        {
            IngestionBatchId = request.BatchId, OrganizationId = organizationId, SourceType = request.SourceType,
            SourceName = request.SourceName, SchemaVersion = request.SchemaVersion, StartedAtUtc = now,
            CompletedAtUtc = now, TotalRows = request.Rows.Count, AcceptedRows = acceptedRows.Count,
            RejectedRows = request.Rows.Count - acceptedRows.Count, Status = acceptedRows.Count == request.Rows.Count ? "COMPLETED" : "PARTIAL"
        };
        db.IngestionBatches.Add(batch);
        var rawRows = acceptedRows.Select(x => new MeasurementRaw
        {
            OrganizationId = organizationId, StationId = x.Row.StationId, ParameterId = x.Row.ParameterId,
            IngestionBatchId = request.BatchId, DeviceTimestampUtc = DateTime.SpecifyKind(x.Row.TimestampUtc, DateTimeKind.Utc),
            IngestionTimestampUtc = now, RawValue = x.Row.Value, RawUnit = x.Row.Unit, PayloadJson = x.Row.PayloadJson,
            DeviceSequence = x.Row.DeviceSequence, IsDuplicate = false, CreatedAtUtc = now
        }).ToList();
        db.MeasurementRaws.AddRange(rawRows);
        await db.SaveChangesAsync(cancellationToken);
        var accepted = acceptedRows.ToDictionary(x => x.Index, x => rawRows[acceptedRows.IndexOf(x)].MeasurementRawId);
        var outcomes = request.Rows.Select((_, index) => accepted.TryGetValue(index, out var rawId)
            ? new IngestionRowOutcome(index, "ACCEPTED", null, rawId)
            : duplicateOutcomes.TryGetValue(index, out var duplicate) ? duplicate
            : new IngestionRowOutcome(index, "QUARANTINED", "validation_failed", null)).ToList();
        return new IngestionBatchResult(request.BatchId, acceptedRows.Count, duplicateOutcomes.Count, request.Rows.Count - acceptedRows.Count - duplicateOutcomes.Count, outcomes);
    }

    public async Task<IngestionPreviewResult> PreviewAsync(IngestionBatchRequest request, CancellationToken cancellationToken)
    {
        if (request.Rows.Count is 0 or > 1000) throw new ArgumentOutOfRangeException(nameof(request.Rows), "A batch must contain between 1 and 1000 rows.");
        if (tenant.OrganizationId is not Guid organizationId) throw new UnauthorizedAccessException("A valid organization scope is required.");
        var (ownedStations, bindings) = await LoadScopeAsync(request, organizationId, cancellationToken);
        var now = DateTime.UtcNow;
        var seen = new HashSet<(Guid, int, DateTime)>();
        var outcomes = new List<IngestionRowOutcome>(request.Rows.Count);
        foreach (var (row, index) in request.Rows.Select((row, index) => (row, index)))
        {
            var reason = Validate(row, ownedStations, bindings, now);
            var key = (row.StationId, row.ParameterId, DateTime.SpecifyKind(row.TimestampUtc, DateTimeKind.Utc));
            if (reason is null && (!seen.Add(key) || await db.MeasurementCleans.AnyAsync(x => x.StationId == row.StationId && x.ParameterId == row.ParameterId && x.TimestampUtc == key.Item3 && (tenant.OrganizationId == null || x.OrganizationId == organizationId), cancellationToken)))
                outcomes.Add(new IngestionRowOutcome(index, "DUPLICATE", "measurement_already_exists", null));
            else if (reason is null) outcomes.Add(new IngestionRowOutcome(index, "ACCEPTED", null, null));
            else outcomes.Add(new IngestionRowOutcome(index, "QUARANTINED", reason, null));
        }
        return new IngestionPreviewResult(request.BatchId, outcomes.Count(x => x.Status == "ACCEPTED"), outcomes.Count(x => x.Status == "DUPLICATE"), outcomes.Count(x => x.Status == "QUARANTINED"), outcomes);
    }

    private async Task<(HashSet<Guid> Stations, Dictionary<(Guid, int), Domain.Entities.StationParameter> Bindings)> LoadScopeAsync(IngestionBatchRequest request, Guid organizationId, CancellationToken cancellationToken)
    {
        var stationIds = request.Rows.Select(row => row.StationId).Distinct().ToArray();
        var ownedStations = await db.Stations.AsNoTracking().Where(station => station.OrganizationId == organizationId && stationIds.Contains(station.StationId)).Select(station => station.StationId).ToHashSetAsync(cancellationToken);
        var bindings = await db.StationParameters.AsNoTracking().Include(x => x.Parameter).Where(x => ownedStations.Contains(x.StationId) && x.IsEnabled).ToDictionaryAsync(x => (x.StationId, x.ParameterId), cancellationToken);
        return (ownedStations, bindings);
    }

    private static string? Validate(IngestionRowRequest row, ISet<Guid> ownedStations, IReadOnlyDictionary<(Guid StationId, int ParameterId), Domain.Entities.StationParameter> bindings, DateTime now)
    {
        if (!ownedStations.Contains(row.StationId)) return "station_not_in_tenant";
        if (!bindings.TryGetValue((row.StationId, row.ParameterId), out var binding)) return "station_parameter_not_configured";
        if (!string.Equals(row.Unit, binding.SourceUnit, StringComparison.OrdinalIgnoreCase)) return "unit_mismatch";
        if (row.TimestampUtc.Kind == DateTimeKind.Local) return "timestamp_must_be_utc";
        if (row.TimestampUtc > now.AddMinutes(5)) return "timestamp_too_far_in_future";
        if (row.TimestampUtc < now.AddYears(-10)) return "timestamp_out_of_retention_window";
        if (row.Value is null) return "value_invalid";
        if (row.PayloadJson?.Length > 64_000) return "payload_too_large";
        return null;
    }
}
