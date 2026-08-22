namespace WaterOperations.Application.Features.ProductCapabilities.AI;

public sealed record AiInsightRequest(Guid OrganizationId, Guid StationId, string InsightType, DateTimeOffset? AsOfUtc);
public sealed record AiInsightResponse(string ModelVersion, string InsightType, decimal? Score, string PayloadJson, bool IsFallback);

public interface IAiModelClient
{
    Task<AiInsightResponse?> GetInsightAsync(AiInsightRequest request, string? correlationId, CancellationToken cancellationToken);
}
