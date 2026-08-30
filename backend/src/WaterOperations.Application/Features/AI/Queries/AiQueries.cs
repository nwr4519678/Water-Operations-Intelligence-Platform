using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;

namespace WaterOperations.Application.Features.AI.Queries;

// NOTE: GetAiInsightQuery and GetAiInsightQueryHandler live in AiInsightQuery.cs

public sealed record GetAnomaliesQuery(
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AnomalyDto>>>, IRequireOrganization, IRequireUser;

public sealed record GetModelsQuery(
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ModelDto>>>, IRequireOrganization, IRequireUser;

public sealed class GetAnomaliesQueryHandler(
    IAiModelRepository repository,
    ICurrentUser user) : IQueryHandler<GetAnomaliesQuery, ScopeResult<PagedResult<AnomalyDto>>>
{
    public async Task<ScopeResult<PagedResult<AnomalyDto>>> Handle(
        GetAnomaliesQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetAnomaliesAsync(
            user.OrganizationId!.Value,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetModelsQueryHandler(
    IAiModelRepository repository,
    ICurrentUser user) : IQueryHandler<GetModelsQuery, ScopeResult<PagedResult<ModelDto>>>
{
    public async Task<ScopeResult<PagedResult<ModelDto>>> Handle(
        GetModelsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetModelsAsync(
            user.OrganizationId!.Value,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}
