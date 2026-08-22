using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.AI.Contracts;

public interface IAiModelRepository
{
    Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<ModelDto>> GetModelsAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<ModelMutationResult> PromoteModelAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ModelMutationResult> StartModelRetrainingAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ModelMutationResult> RetireModelAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken);
}
