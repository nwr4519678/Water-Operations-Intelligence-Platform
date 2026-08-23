using WaterOperations.Application.Features.Pipeline.DTOs;

namespace WaterOperations.Application.Features.Pipeline.Interfaces;

public interface IPipelineRepository
{
    public Task<CleanBatchResult?> PublishCleanAsync(
        Guid organizationId,
        Guid batchId,
        CleanBatchRequestDto request,
        CancellationToken cancellationToken);
}
