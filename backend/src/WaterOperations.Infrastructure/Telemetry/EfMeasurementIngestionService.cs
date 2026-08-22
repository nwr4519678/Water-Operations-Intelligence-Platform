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
        if (await db.IngestionBatches.AnyAsync(batch => batch.IngestionBatchId == request.BatchId, cancellationToken))
            return new IngestionBatchResult(request.BatchId, 0, request.Rows.Count, 0,
                request.Rows.Select((_, index) => new IngestionRowOutcome(index, "DUPLICATE", "batch_already_processed", null)).ToList());

        var stationIds = request.Rows.Select(row => row.StationId).Distinct().ToArray();
        var ownedStations = await db.Stations.AsNoTracking()
            .Where(station => station.OrganizationId == organizationId && stationIds.Contains(station.StationId))
            .Select(station => station.StationId).ToHashSetAsync(cancellationToken);
        var bindings = await db.StationParameters.AsNoTracking().Include(x => x.Parameter)
            .Where(x => ownedStations.Contains(x.StationId) && x.IsEnabled)
            .ToDictionaryAsync(x => (x.StationId, x.ParameterId), cancellationToken);
        var now = DateTime.UtcNow;
        var valid = request.Rows.Select((row, index) => new { row, index, reason = Validate(row, ownedStations, bindings, now) })
            .Where(x => x.reason is null).ToList();
        var batch = new IngestionBatch
        {
            IngestionBatchId = request.BatchId, OrganizationId = organizationId, SourceType = request.SourceType,
            SourceName = request.SourceName, SchemaVersion = request.SchemaVersion, StartedAtUtc = now,
            CompletedAtUtc = now, TotalRows = request.Rows.Count, AcceptedRows = valid.Count,
            RejectedRows = request.Rows.Count - valid.Count, Status = valid.Count == request.Rows.Count ? "COMPLETED" : "PARTIAL"
        };
        db.IngestionBatches.Add(batch);
        var rawRows = valid.Select(x => new MeasurementRaw
        {
            OrganizationId = organizationId, StationId = x.row.StationId, ParameterId = x.row.ParameterId,
            IngestionBatchId = request.BatchId, DeviceTimestampUtc = DateTime.SpecifyKind(x.row.TimestampUtc, DateTimeKind.Utc),
            IngestionTimestampUtc = now, RawValue = x.row.Value, RawUnit = x.row.Unit, PayloadJson = x.row.PayloadJson,
            DeviceSequence = x.row.DeviceSequence, IsDuplicate = false, CreatedAtUtc = now
        }).ToList();
        db.MeasurementRaws.AddRange(rawRows);
        await db.SaveChangesAsync(cancellationToken);
        var accepted = valid.ToDictionary(x => x.index, x => rawRows[valid.IndexOf(x)].MeasurementRawId);
        var outcomes = request.Rows.Select((_, index) => accepted.TryGetValue(index, out var rawId)
            ? new IngestionRowOutcome(index, "ACCEPTED", null, rawId)
            : new IngestionRowOutcome(index, "QUARANTINED", "validation_failed", null)).ToList();
        return new IngestionBatchResult(request.BatchId, valid.Count, 0, request.Rows.Count - valid.Count, outcomes);
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
