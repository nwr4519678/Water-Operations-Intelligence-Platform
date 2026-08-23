using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Ingestion.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Ingestion.Repositories;

public sealed class IngestionRepository(IRepositoryContext repository) : IIngestionRepository
{
    public Task<bool> ExistsAsync(
        Guid organizationId,
        Guid batchId,
        CancellationToken cancellationToken) =>
        repository.Query<IngestionBatch>()
            .AnyAsync(
                x => x.IngestionBatchId == batchId && x.OrganizationId == organizationId,
                cancellationToken);

    public async Task<HashSet<Guid>> GetActiveStationIdsAsync(
        Guid organizationId,
        IReadOnlyCollection<Guid> stationIds,
        CancellationToken cancellationToken) =>
        await repository.Query<Station>()
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                stationIds.Contains(x.StationId) &&
                x.IsActive)
            .Select(x => x.StationId)
            .ToHashSetAsync(cancellationToken);

    public async Task<BatchDetails?> GetDetailsAsync(
        Guid organizationId,
        Guid batchId,
        CancellationToken cancellationToken) =>
        await repository.Query<IngestionBatch>()
            .AsNoTracking()
            .Where(x =>
                x.IngestionBatchId == batchId &&
                x.OrganizationId == organizationId)
            .Select(x => new BatchDetails(
                x.IngestionBatchId,
                x.SourceType,
                x.SourceName,
                x.SchemaVersion,
                x.StartedAtUtc,
                x.CompletedAtUtc,
                x.TotalRows,
                x.AcceptedRows,
                x.RejectedRows,
                x.Status,
                x.ErrorMessage))
            .SingleOrDefaultAsync(cancellationToken);

    public void AddBatch(
        IngestionBatch batch,
        IReadOnlyCollection<ReadingDto> acceptedReadings,
        DateTime occurredAtUtc)
    {
        repository.Add(batch);
        repository.AddRange(
            acceptedReadings.Select(reading => new MeasurementRaw
            {
                OrganizationId = batch.OrganizationId,
                StationId = reading.StationId,
                ParameterId = reading.ParameterId,
                IngestionBatchId = batch.IngestionBatchId,
                DeviceTimestampUtc = reading.TimestampUtc.UtcDateTime,
                IngestionTimestampUtc = occurredAtUtc,
                RawValue = reading.Value,
                RawUnit = reading.Unit,
                PayloadJson = reading.PayloadJson ?? "{}",
                DeviceSequence = reading.DeviceSequence,
                CreatedAtUtc = occurredAtUtc
            }));
        repository.Add(
            new OutboxMessage
            {
                OutboxMessageId = Guid.NewGuid(),
                OrganizationId = batch.OrganizationId,
                EventType = "TelemetryBatchAccepted",
                PayloadJson = JsonSerializer.Serialize(
                    new
                    {
                        batchId = batch.IngestionBatchId,
                        batch.Status,
                        batch.AcceptedRows,
                        batch.RejectedRows
                    }),
                OccurredAtUtc = occurredAtUtc
            });
    }
}
