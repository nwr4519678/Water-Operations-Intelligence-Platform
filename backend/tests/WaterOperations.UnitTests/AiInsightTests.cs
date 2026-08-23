using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.ProductCapabilities.AI;

namespace WaterOperations.UnitTests;

public sealed class AiInsightTests
{
    [Fact]
    public async Task UnavailableModelReturnsStableFallbackState()
    {
        var handler = new GetAiInsightQueryHandler(
            new FakeAiClient(null),
            new FakeCurrentUser(Guid.NewGuid()),
            new FakeCorrelationContext("trace-123"));

        var result = await handler.Handle(
            new GetAiInsightQuery(Guid.NewGuid(), "forecast", null),
            CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.Equal("AI_UNAVAILABLE", result.Value!.Status);
        Assert.Null(result.Value.Data);
    }

    [Fact]
    public async Task AvailableModelResponseIsPreservedWithCorrelationContext()
    {
        var response = new AiInsightResponse("model-1", "forecast", 0.91m, "{}", false);
        var client = new FakeAiClient(response);
        var handler = new GetAiInsightQueryHandler(client, new FakeCurrentUser(Guid.NewGuid()), new FakeCorrelationContext("trace-456"));

        var result = await handler.Handle(new GetAiInsightQuery(Guid.NewGuid(), "forecast", null), CancellationToken.None);

        Assert.Equal("READY", result.Value!.Status);
        Assert.Equal(response, result.Value.Data);
        Assert.Equal("trace-456", client.CorrelationId);
    }

    private sealed class FakeAiClient(AiInsightResponse? response) : IAiModelClient
    {
        public string? CorrelationId { get; private set; }

        public Task<AiInsightResponse?> GetInsightAsync(AiInsightRequest request, string? correlationId, CancellationToken cancellationToken)
        {
            CorrelationId = correlationId;
            return Task.FromResult(response);
        }
    }

    private sealed class FakeCurrentUser(Guid organizationId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? OrganizationId => organizationId;
        public Guid? RegionId => null;
        public string? Organization => null;
        public string? Region => null;
        public Guid? UserId => Guid.NewGuid();
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }

    private sealed class FakeCorrelationContext(string value) : ICorrelationContext
    {
        public string CorrelationId => value;
    }
}
