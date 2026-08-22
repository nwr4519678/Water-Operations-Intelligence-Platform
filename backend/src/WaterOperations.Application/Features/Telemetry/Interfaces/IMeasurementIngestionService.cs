using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Interfaces;

public interface IMeasurementIngestionService
{
    Task<IngestionBatchResult> IngestAsync(IngestionBatchRequest request, CancellationToken cancellationToken);
    Task<IngestionPreviewResult> PreviewAsync(IngestionBatchRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
}
