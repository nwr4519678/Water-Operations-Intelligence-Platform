using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;

namespace WaterOperations.Application.Features.AI.Queries;

public sealed record GetAiInsightQuery(
    Guid? StationId,
    string InsightType,
    DateTimeOffset? AsOfUtc)
    : IQuery<ScopeResult<AiInsightResult>>, IRequireOrganization;

public sealed class GetAiInsightQueryHandler(
    IAiModelClient client,
    ICurrentUser currentUser,
    ICorrelationContext correlationContext)
    : IQueryHandler<GetAiInsightQuery, ScopeResult<AiInsightResult>>
{
    public async Task<ScopeResult<AiInsightResult>> Handle(
        GetAiInsightQuery request,
        CancellationToken cancellationToken)
    {
        var response = await client.GetInsightAsync(
            new AiInsightRequest(
                currentUser.OrganizationId!.Value,
                request.StationId ?? Guid.Empty,
                request.InsightType,
                request.AsOfUtc),
            correlationContext.CorrelationId,
            cancellationToken);

        if (response is null)
        {
            return ScopeResult.Authorized(new AiInsightResult("AI_UNAVAILABLE", null));
        }

        var status = response.ModelVersion.ToUpperInvariant() switch
        {
            "NO_MODEL" => "NO_MODEL",
            "LEARNING_IN_PROGRESS" => "LEARNING_IN_PROGRESS",
            _ => response.IsFallback ? "AI_UNAVAILABLE" : "READY"
        };

        return ScopeResult.Authorized(new AiInsightResult(status, response));
    }
}

