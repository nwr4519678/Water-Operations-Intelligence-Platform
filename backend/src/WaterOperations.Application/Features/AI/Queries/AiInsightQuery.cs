using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;

namespace WaterOperations.Application.Features.AI.Queries;

public sealed record GetAiInsightQuery(
    Guid? StationId,
    string InsightType,
    DateTimeOffset? AsOfUtc,
    int? ParameterId = null)
    : IQuery<ScopeResult<AiInsightResult>>, IRequireOrganization;

public sealed class GetAiInsightQueryHandler(
    IAiModelClient client,
    ICurrentUser currentUser,
    ICorrelationContext correlationContext,
    ITelemetryQueryRepository? telemetry = null)
    : IQueryHandler<GetAiInsightQuery, ScopeResult<AiInsightResult>>
{
    public async Task<ScopeResult<AiInsightResult>> Handle(
        GetAiInsightQuery request,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AiTelemetryObservation>? observations = null;
        var insightType = request.InsightType.Trim().ToLowerInvariant();
        if (telemetry is not null && request.StationId.HasValue && (insightType is "anomaly" or "forecast"))
        {
            var points = await telemetry.GetAsync(
                currentUser.OrganizationId!.Value,
                currentUser.RegionId,
                new TelemetryQuery(null, request.AsOfUtc, request.StationId, request.ParameterId, 168),
                cancellationToken);

            // If no parameter was specified, use the densest single parameter
            // series; mixing units/sensors would make inference invalid.
            var series = points
                .Where(point => point.Value.HasValue)
                .GroupBy(point => point.ParameterId)
                .OrderByDescending(group => group.Count())
                .ThenBy(group => group.Key)
                .FirstOrDefault()?
                .OrderBy(point => point.TimestampUtc)
                .Select(point => new AiTelemetryObservation(
                    new DateTimeOffset(DateTime.SpecifyKind(point.TimestampUtc, DateTimeKind.Utc)),
                    (double)point.Value!.Value))
                .ToList();
            observations = series is { Count: > 0 } ? series : null;
        }

        var response = await client.GetInsightAsync(
            new AiInsightRequest(
                currentUser.OrganizationId!.Value,
                request.StationId ?? Guid.Empty,
                request.InsightType,
                request.AsOfUtc,
                request.ParameterId,
                observations),
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

        return ScopeResult.Authorized(new AiInsightResult(status, response, request.StationId));
    }
}
