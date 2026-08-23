using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Search.DTOs;
using WaterOperations.Application.Features.Search.Interfaces;

namespace WaterOperations.Application.Features.Search.Queries;

public sealed record SearchProductQuery(
    string Query,
    bool IncludeUsers,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<SearchResultDto>>>, IRequireOrganization, IRequireUser;

public sealed class SearchProductQueryHandler(
    ISearchRepository repository,
    ICurrentUser user) : IQueryHandler<SearchProductQuery, ScopeResult<PagedResult<SearchResultDto>>>
{
    public async Task<ScopeResult<PagedResult<SearchResultDto>>> Handle(
        SearchProductQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.SearchAsync(
            user.OrganizationId!.Value,
            request.Query,
            request.IncludeUsers,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}
