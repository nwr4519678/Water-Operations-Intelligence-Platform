using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;

namespace WaterOperations.Infrastructure.AI;

public sealed partial class HttpAiModelClient(
    HttpClient httpClient,
    IOptions<AiModelClientOptions> options,
    ILogger<HttpAiModelClient> logger,
    AiModelCircuitBreaker circuitBreaker)
    : IAiModelClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly AiModelClientOptions settings = options.Value;

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "AI Service returned HTTP {StatusCode} for insight request")]
    private partial void LogHttpWarning(System.Net.HttpStatusCode statusCode);

    [LoggerMessage(EventId = 2, Level = LogLevel.Warning, Message = "Failed to parse AI Service payload output")]
    private partial void LogJsonParseWarning(Exception exception);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "AI Service client communication error")]
    private partial void LogCommunicationError(Exception exception);

    [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "AI Service circuit is open; inference request skipped")]
    private partial void LogCircuitOpen();

    public async Task<AiInsightResponse?> GetInsightAsync(
        AiInsightRequest request,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        if (circuitBreaker.IsOpen(DateTimeOffset.UtcNow))
        {
            LogCircuitOpen();
            return null;
        }

        try
        {
            using var message = new HttpRequestMessage(HttpMethod.Post, "insights")
            {
                Content = JsonContent.Create(request, options: JsonOptions)
            };

            if (!string.IsNullOrWhiteSpace(correlationId))
            {
                message.Headers.TryAddWithoutValidation("X-Correlation-Id", correlationId);
            }

            using var response = await httpClient.SendAsync(message, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                LogHttpWarning(response.StatusCode);
                RecordFailure();
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<AiInsightResponse>(JsonOptions, cancellationToken);
            if (result is null || string.IsNullOrWhiteSpace(result.ModelVersion))
            {
                return null;
            }

            // Validate that payloadJson is valid JSON
            using var _ = JsonDocument.Parse(result.PayloadJson);
            circuitBreaker.RecordSuccess();
            return result;
        }
        catch (JsonException ex)
        {
            LogJsonParseWarning(ex);
            RecordFailure();
            return null;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            LogCommunicationError(ex);
            RecordFailure();
            return null;
        }
    }

    private void RecordFailure() => circuitBreaker.RecordFailure(
        settings.CircuitFailureThreshold,
        TimeSpan.FromSeconds(Math.Clamp(settings.CircuitBreakDurationSeconds, 1, 300)),
        DateTimeOffset.UtcNow);
}
