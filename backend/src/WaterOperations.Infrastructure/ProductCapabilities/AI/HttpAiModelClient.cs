using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using WaterOperations.Application.Features.ProductCapabilities.AI;

namespace WaterOperations.Infrastructure.ProductCapabilities.AI;

#pragma warning disable CA1848
public sealed class HttpAiModelClient(HttpClient httpClient, ILogger<HttpAiModelClient> logger) : IAiModelClient
{
    public async Task<AiInsightResponse?> GetInsightAsync(AiInsightRequest request, string? correlationId, CancellationToken cancellationToken)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "api/v1/insights") { Content = JsonContent.Create(request) };
        if (!string.IsNullOrWhiteSpace(correlationId)) message.Headers.TryAddWithoutValidation("X-Correlation-Id", correlationId);
        using var response = await httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("AI service returned status {StatusCode} for {InsightType}", response.StatusCode, request.InsightType);
            return null;
        }
        return await response.Content.ReadFromJsonAsync<AiInsightResponse>(cancellationToken);
    }
}
#pragma warning restore CA1848
