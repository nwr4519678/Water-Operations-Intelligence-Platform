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
            return new IngestionBatchResult(request.BatchId, 0, request.Rows.Count, 0);

        var stationIds = request.Rows.Select(row => row.StationId).Distinct().ToArray();
        var ownedStations = await db.Stations.AsNoTracking()
            .Where(station => station.OrganizationId == organizationId && stationIds.Contains(station.StationId))
            .Select(station => station.StationId).ToHashSetAsync(cancellationToken);
        var valid = request.Rows.Where(row => ownedStations.Contains(row.StationId) && row.TimestampUtc.Kind != DateTimeKind.Local && row.TimestampUtc <= DateTime.UtcNow.AddMinutes(5)).ToList();
        var batch = new IngestionBatch
        {
            IngestionBatchId = request.BatchId, OrganizationId = organizationId, SourceType = request.SourceType,
            SourceName = request.SourceName, SchemaVersion = request.SchemaVersion, StartedAtUtc = DateTime.UtcNow,
            CompletedAtUtc = DateTime.UtcNow, TotalRows = request.Rows.Count, AcceptedRows = valid.Count,
            RejectedRows = request.Rows.Count - valid.Count, Status = valid.Count == request.Rows.Count ? "COMPLETED" : "PARTIAL"
        };
        db.IngestionBatches.Add(batch);
        db.MeasurementRaws.AddRange(valid.Select(row => new MeasurementRaw
        {
            OrganizationId = organizationId, StationId = row.StationId, ParameterId = row.ParameterId,
            IngestionBatchId = request.BatchId, DeviceTimestampUtc = DateTime.SpecifyKind(row.TimestampUtc, DateTimeKind.Utc),
            IngestionTimestampUtc = DateTime.UtcNow, RawValue = row.Value, RawUnit = row.Unit, PayloadJson = row.PayloadJson,
            DeviceSequence = row.DeviceSequence, IsDuplicate = false, CreatedAtUtc = DateTime.UtcNow
        }));
        await db.SaveChangesAsync(cancellationToken);
        return new IngestionBatchResult(request.BatchId, valid.Count, 0, request.Rows.Count - valid.Count);
    }
}
