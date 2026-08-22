namespace WaterOperations.Application.Features.ProductCapabilities.AI;

public sealed record AiInsightRequest(Guid OrganizationId, Guid StationId, string InsightType, DateTimeOffset? AsOfUtc);
public sealed record AiInsightResponse(
    string ModelVersion,
    string InsightType,
    decimal? Score,
    string PayloadJson,
    bool IsFallback,
    DateTimeOffset? GeneratedAtUtc = null,
    DateTimeOffset? DataWindowStartUtc = null,
    DateTimeOffset? DataWindowEndUtc = null,
    string? FeatureSetVersion = null,
    string? CleaningRulesetVersion = null);
public sealed record AiInsightResult(string Status, AiInsightResponse? Data);

public interface IAiModelClient
{
    Task<AiInsightResponse?> GetInsightAsync(AiInsightRequest request, string? correlationId, CancellationToken cancellationToken);
}
