using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Application.Features.AI.Queries;

namespace WaterOperations.UnitTests;

public sealed class AiInsightTests
{
    [Fact]
    public async Task UnavailableModelReturnsStableFallbackState()
    {
        var orgId = Guid.NewGuid();
        var handler = new GetAiInsightQueryHandler(
            new FakeAiClient(null),
            new FakeCurrentUser(orgId),
            new FakeCorrelationContext("trace-123"));

        var result = await handler.Handle(
            new GetAiInsightQuery(null, "forecast", null),
            CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.Equal("AI_UNAVAILABLE", result.Value!.Status);
        Assert.Null(result.Value.Response);
    }

    [Fact]
    public async Task AvailableModelResponseIsPreservedWithCorrelationContext()
    {
        var response = new AiInsightResponse("model-v1", "forecast", "{}", IsFallback: false);
        var client = new FakeAiClient(response);
        var orgId = Guid.NewGuid();
        var handler = new GetAiInsightQueryHandler(
            client,
            new FakeCurrentUser(orgId),
            new FakeCorrelationContext("trace-456"));

        var result = await handler.Handle(
            new GetAiInsightQuery(null, "forecast", null),
            CancellationToken.None);

        Assert.Equal("READY", result.Value!.Status);
        Assert.Equal(response, result.Value.Response);
        Assert.Equal("trace-456", client.CorrelationId);
    }

    private sealed class FakeAiClient(AiInsightResponse? response) : IAiModelClient
    {
        public string? CorrelationId { get; private set; }

        public Task<AiInsightResponse?> GetInsightAsync(
            AiInsightRequest request,
            string? correlationId,
            CancellationToken cancellationToken)
        {
            CorrelationId = correlationId;
            return Task.FromResult(response);
        }
    }

    private sealed class FakeCurrentUser(Guid organizationId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "ai@water.local";
        public Guid? OrganizationId => organizationId;
        public string? Organization => organizationId.ToString();
        public Guid? RegionId => null;
        public string? Region => null;
        public IReadOnlyCollection<string> Roles => ["ADMIN"];
    }

    private sealed class FakeCorrelationContext(string value) : ICorrelationContext
    {
        public string CorrelationId => value;
    }
}
