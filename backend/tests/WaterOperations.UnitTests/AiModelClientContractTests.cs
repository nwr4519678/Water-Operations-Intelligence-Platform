using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Infrastructure.AI;

namespace WaterOperations.UnitTests;

public sealed class AiModelClientContractTests
{
    [Fact]
    public async Task SendsCorrelationAndAcceptsValidatedResponse()
    {
        var handler = new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"modelVersion\":\"v1\",\"insightType\":\"forecast\",\"payloadJson\":\"{}\",\"isFallback\":false}", Encoding.UTF8, "application/json")
        });
        var client = CreateClient(handler);

        var result = await client.GetInsightAsync(new AiInsightRequest(Guid.NewGuid(), Guid.NewGuid(), "forecast", null), "trace-abc", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("v1", result.ModelVersion);
        Assert.Equal("trace-abc", handler.Request!.Headers.GetValues("X-Correlation-Id").Single());
    }

    [Fact]
    public async Task RejectsMalformedPayloadWithoutExposingIt()
    {
        var handler = new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"modelVersion\":\"v1\",\"insightType\":\"forecast\",\"payloadJson\":\"not-json\"}", Encoding.UTF8, "application/json")
        });
        var client = CreateClient(handler);

        var result = await client.GetInsightAsync(new AiInsightRequest(Guid.NewGuid(), Guid.NewGuid(), "forecast", null), null, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task OpensCircuitAfterConfiguredFailureThreshold()
    {
        var handler = new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var client = new HttpAiModelClient(
            new HttpClient(handler) { BaseAddress = new Uri("http://ai.internal/") },
            Options.Create(new AiModelClientOptions { CircuitFailureThreshold = 1, CircuitBreakDurationSeconds = 30 }),
            NullLogger<HttpAiModelClient>.Instance,
            new AiModelCircuitBreaker());
        var request = new AiInsightRequest(Guid.NewGuid(), Guid.NewGuid(), "forecast", null);

        Assert.Null(await client.GetInsightAsync(request, null, CancellationToken.None));
        Assert.Null(await client.GetInsightAsync(request, null, CancellationToken.None));
        Assert.Equal(1, handler.RequestCount);
    }

    private static HttpAiModelClient CreateClient(HttpMessageHandler handler) =>
        new(
            new HttpClient(handler) { BaseAddress = new Uri("http://ai.internal/") },
            Options.Create(new AiModelClientOptions { CircuitFailureThreshold = 5 }),
            NullLogger<HttpAiModelClient>.Instance,
            new AiModelCircuitBreaker());

    private sealed class RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public int RequestCount { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            RequestCount++;
            return Task.FromResult(responseFactory(request));
        }
    }
}
