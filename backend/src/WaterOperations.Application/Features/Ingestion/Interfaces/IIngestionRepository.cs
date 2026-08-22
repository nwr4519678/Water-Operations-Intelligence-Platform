using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Ingestion.Interfaces;

public interface ICsvBatchParser
{
    Task<BatchRequestDto?> ParseAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken);
}

public interface IIngestionRepository
{
    Task<bool> ExistsAsync(
        Guid organizationId,
        Guid batchId,
        CancellationToken cancellationToken);

    Task<HashSet<Guid>> GetActiveStationIdsAsync(
        Guid organizationId,
        IReadOnlyCollection<Guid> stationIds,
        CancellationToken cancellationToken);

    Task<BatchDetails?> GetDetailsAsync(
        Guid organizationId,
        Guid batchId,
        CancellationToken cancellationToken);

    void AddBatch(
        IngestionBatch batch,
        IReadOnlyCollection<ReadingDto> acceptedReadings,
        DateTime occurredAtUtc);
}
