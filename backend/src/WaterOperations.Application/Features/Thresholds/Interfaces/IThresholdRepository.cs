using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Thresholds.DTOs;

namespace WaterOperations.Application.Features.Thresholds.Interfaces;

public interface IThresholdRepository
{
    Task<PagedResult<ThresholdDto>> SearchAsync(Guid organizationId, Guid? stationId, int? parameterId, PaginationRequest pagination, CancellationToken cancellationToken = default);
    Task<ThresholdDto?> GetByIdAsync(Guid organizationId, long thresholdId, CancellationToken cancellationToken = default);
    Task<ThresholdDto> CreateAsync(Guid organizationId, Guid userId, CreateThresholdRequest request, CancellationToken cancellationToken = default);
    Task<ThresholdDto?> UpdateAsync(Guid organizationId, Guid userId, long thresholdId, UpdateThresholdRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeactivateAsync(Guid organizationId, Guid userId, long thresholdId, CancellationToken cancellationToken = default);
}
