using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Stations.DTOs;

namespace WaterOperations.Application.Features.Stations.Interfaces;

public interface IStationQueryRepository
{
    public Task<PagedResult<StationListItemDto>> SearchAsync(
        Guid organizationId,
        StationSearchRequest request,
        CancellationToken cancellationToken);

    public Task<StationDetailsDto?> GetAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken);
}
