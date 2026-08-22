using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;

namespace WaterOperations.Application.Features.ProductCapabilities.AI;

public sealed record GetAiInsightQuery(Guid StationId, string InsightType, DateTimeOffset? AsOfUtc) : IQuery<ScopeResult<AiInsightResult>>, IRequireOrganization;

public sealed class GetAiInsightQueryHandler(IAiModelClient client, ICurrentUser currentUser) : IQueryHandler<GetAiInsightQuery, ScopeResult<AiInsightResult>>
{
    public async Task<ScopeResult<AiInsightResult>> Handle(GetAiInsightQuery request, CancellationToken cancellationToken)
    {
        var response = await client.GetInsightAsync(new AiInsightRequest(currentUser.OrganizationId!.Value, request.StationId, request.InsightType, request.AsOfUtc), null, cancellationToken);
        return ScopeResult.Authorized(response is null
            ? new AiInsightResult("AI_UNAVAILABLE", null)
            : new AiInsightResult("AVAILABLE", response));
    }
}
