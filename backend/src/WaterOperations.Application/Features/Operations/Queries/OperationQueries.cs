using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;

namespace WaterOperations.Application.Features.Operations.Queries;

public sealed record GetOperationsOverviewQuery(DateTimeOffset? AsOf)
    : IQuery<ScopeResult<OperationsOverviewDto>>, IRequireOrganization;

public sealed record GetDataQualityQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    PaginationRequest Pagination)
    : IQuery<ScopeResult<PagedResult<DataQualityDto>>>, IRequireOrganization;

public sealed class GetOperationsOverviewQueryHandler(
    IOperationsQueryRepository operations,
    ICurrentUser currentUser)
    : IQueryHandler<GetOperationsOverviewQuery, ScopeResult<OperationsOverviewDto>>
{
    public async Task<ScopeResult<OperationsOverviewDto>> Handle(
        GetOperationsOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var result = await operations.GetOverviewAsync(
            currentUser.OrganizationId!.Value,
            currentUser.RegionId,
            request.AsOf,
            cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

public sealed class GetDataQualityQueryHandler(
    IOperationsQueryRepository operations,
    ICurrentUser currentUser)
    : IQueryHandler<GetDataQualityQuery, ScopeResult<PagedResult<DataQualityDto>>>
{
    public async Task<ScopeResult<PagedResult<DataQualityDto>>> Handle(
        GetDataQualityQuery request,
        CancellationToken cancellationToken)
    {
        var result = await operations.GetDataQualityAsync(
            currentUser.OrganizationId!.Value,
            currentUser.RegionId,
            request.From,
            request.To,
            request.Pagination,
            cancellationToken);
        return ScopeResult.Authorized(result);
    }
}
