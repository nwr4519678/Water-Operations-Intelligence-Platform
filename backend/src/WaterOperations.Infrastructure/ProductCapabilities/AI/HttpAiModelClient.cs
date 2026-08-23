using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WaterOperations.Application.Features.ProductCapabilities.AI;

namespace WaterOperations.Infrastructure.ProductCapabilities.AI;

#pragma warning disable CA1848
public sealed class HttpAiModelClient(
    HttpClient httpClient,
    IOptions<AiModelClientOptions> options,
    ILogger<HttpAiModelClient> logger) : IAiModelClient, IDisposable
{
    private static int consecutiveFailures;
    private static long circuitOpenedUntilTicks;
    private readonly SemaphoreSlim bulkhead = new(Math.Clamp(options.Value.MaxConcurrentRequests, 1, 256));

    public async Task<AiInsightResponse?> GetInsightAsync(AiInsightRequest request, string? correlationId, CancellationToken cancellationToken)
    {
        if (IsCircuitOpen()) return null;
        if (!await bulkhead.WaitAsync(TimeSpan.FromSeconds(1), cancellationToken)) return null;
        try
        {
            using var message = new HttpRequestMessage(HttpMethod.Post, "api/v1/insights") { Content = JsonContent.Create(request) };
            if (!string.IsNullOrWhiteSpace(correlationId)) message.Headers.TryAddWithoutValidation("X-Correlation-Id", correlationId);
            using var response = await httpClient.SendAsync(message, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                RecordFailure();
                logger.LogWarning("AI service returned status {StatusCode} for {InsightType}", response.StatusCode, request.InsightType);
                return null;
            }
            var result = await response.Content.ReadFromJsonAsync<AiInsightResponse>(cancellationToken);
            if (!IsValid(result, request.InsightType))
            {
                RecordFailure();
                return null;
            }
            Interlocked.Exchange(ref consecutiveFailures, 0);
            return result;
        }
        catch (HttpRequestException exception)
        {
            RecordFailure();
            logger.LogWarning(exception, "AI service is unavailable for {InsightType}", request.InsightType);
            return null;
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            RecordFailure();
            logger.LogWarning(exception, "AI service timed out for {InsightType}", request.InsightType);
            return null;
        }
        catch (JsonException exception)
        {
            RecordFailure();
            logger.LogWarning(exception, "AI service returned malformed JSON for {InsightType}", request.InsightType);
            return null;
        }
        finally
        {
            bulkhead.Release();
        }
    }

    private static bool IsCircuitOpen() => Interlocked.Read(ref circuitOpenedUntilTicks) > DateTime.UtcNow.Ticks;

    private void RecordFailure()
    {
        if (Interlocked.Increment(ref consecutiveFailures) >= Math.Clamp(options.Value.CircuitFailureThreshold, 1, 100))
        {
            Interlocked.Exchange(ref circuitOpenedUntilTicks, DateTime.UtcNow.AddSeconds(Math.Clamp(options.Value.CircuitBreakSeconds, 1, 600)).Ticks);
        }
    }

    private static bool IsValid(AiInsightResponse? response, string requestedInsightType)
    {
        if (response is null || string.IsNullOrWhiteSpace(response.ModelVersion) || !string.Equals(response.InsightType, requestedInsightType, StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(response.PayloadJson)) return false;
        try { using var document = JsonDocument.Parse(response.PayloadJson); return document.RootElement.ValueKind is not JsonValueKind.Undefined; }
        catch (JsonException) { return false; }
    }

    public void Dispose() => bulkhead.Dispose();
}
#pragma warning restore CA1848
