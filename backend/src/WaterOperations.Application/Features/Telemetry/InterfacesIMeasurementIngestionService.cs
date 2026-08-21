using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Interfaces;

public interface IMeasurementIngestionService
{
    Task<IngestionBatchResult> IngestAsync(IngestionBatchRequest request, CancellationToken cancellationToken);
}
