using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Operations.DTOs;

namespace WaterOperations.Application.Features.Operations.Interfaces;

public interface IOperationsQueryRepository
{
    public Task<OperationsOverviewDto> GetOverviewAsync(
        Guid organizationId,
        Guid? regionId,
        DateTimeOffset? asOf,
        CancellationToken cancellationToken);

    public Task<PagedResult<DataQualityDto>> GetDataQualityAsync(
        Guid organizationId,
        Guid? regionId,
        DateTimeOffset? from,
        DateTimeOffset? until,
        PaginationRequest pagination,
        CancellationToken cancellationToken);
}
