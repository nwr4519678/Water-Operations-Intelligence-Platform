using WaterOperations.Application.Features.AI.DTOs;

namespace WaterOperations.Application.Features.AI.Interfaces;

/// <summary>
/// Client interface for interacting with remote AI inference services.
/// </summary>
public interface IAiModelClient
{
    Task<AiInsightResponse?> GetInsightAsync(
        AiInsightRequest request,
        string? correlationId,
        CancellationToken cancellationToken);
}
