using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Stations.DTOs;
using WaterOperations.Application.Features.Stations.Interfaces;

namespace WaterOperations.Application.Features.Stations.Queries;

public sealed record SearchStationsQuery(
    string? Search,
    Guid? RegionId,
    string? Status,
    PaginationRequest Pagination,
    decimal? MinLatitude = null,
    decimal? MinLongitude = null,
    decimal? MaxLatitude = null,
    decimal? MaxLongitude = null)
    : IQuery<ScopeResult<PagedResult<StationListItemDto>>>, IRequireOrganization;

public sealed record GetStationQuery(Guid StationId)
    : IQuery<ScopeResult<StationDetailsDto>>, IRequireOrganization;

public sealed class SearchStationsQueryHandler(
    IStationQueryRepository stations,
    ICurrentUser currentUser)
    : IQueryHandler<SearchStationsQuery, ScopeResult<PagedResult<StationListItemDto>>>
{
    public async Task<ScopeResult<PagedResult<StationListItemDto>>> Handle(
        SearchStationsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await stations.SearchAsync(
            currentUser.OrganizationId!.Value,
            new StationSearchRequest(request.Search, request.RegionId, request.Status,
                request.Pagination.Page, request.Pagination.PageSize,
                request.MinLatitude, request.MinLongitude,
                request.MaxLatitude, request.MaxLongitude),
            cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

public sealed class GetStationQueryHandler(
    IStationQueryRepository stations,
    ICurrentUser currentUser)
    : IQueryHandler<GetStationQuery, ScopeResult<StationDetailsDto>>
{
    public async Task<ScopeResult<StationDetailsDto>> Handle(
        GetStationQuery request,
        CancellationToken cancellationToken)
    {
        var result = await stations.GetAsync(
            currentUser.OrganizationId!.Value,
            request.StationId,
            cancellationToken);
        return result is null
            ? ScopeResult.NotFound<StationDetailsDto>()
            : ScopeResult.Authorized(result);
    }
}
