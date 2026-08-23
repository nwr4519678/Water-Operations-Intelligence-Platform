using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.AI.DTOs;

namespace WaterOperations.Application.Features.AI.Interfaces;

/// <summary>
/// Repository interface for AI anomaly detection and model registry persistence operations.
/// </summary>
public interface IAiModelRepository
{
    Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken);

    Task<PagedResult<ModelDto>> GetModelsAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken);

    Task<ModelMutationResult> PromoteModelAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken);

    Task<ModelMutationResult> StartModelRetrainingAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken);

    Task<ModelMutationResult> RetireModelAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken);
}
