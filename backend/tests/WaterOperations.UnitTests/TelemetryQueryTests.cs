using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Application.Features.Telemetry.Queries;

namespace WaterOperations.UnitTests;

public sealed class TelemetryQueryTests
{
    private readonly FakeTelemetryQueryRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task GetTelemetryQueryHandler_ReturnsAuthorizedMappedTelemetryItems()
    {
        var handler = new GetTelemetryQueryHandler(repository, user);
        var query = new GetTelemetryQuery(null, null, null, null, 10);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal(10, result.Value.Limit);
        Assert.Single(result.Value.Data);
        Assert.Equal(100L, result.Value.Data[0].Id);
        Assert.Equal(42.5m, result.Value.Data[0].Value);
    }

    [Fact]
    public async Task GetChartQueryHandler_ExistingStation_ReturnsAuthorizedChartResponse()
    {
        var handler = new GetChartQueryHandler(repository, user);
        var query = new GetChartQuery(Guid.NewGuid(), [1], DateTimeOffset.UtcNow.AddHours(-1), DateTimeOffset.UtcNow, 100);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value.Data);
        Assert.Equal(100, result.Value.Limit);
    }

    [Fact]
    public async Task GetChartQueryHandler_UnauthorizedOrMissingStation_ReturnsNotFound()
    {
        repository.ReturnNullChart = true;
        var handler = new GetChartQueryHandler(repository, user);
        var query = new GetChartQuery(Guid.NewGuid(), [1], DateTimeOffset.UtcNow.AddHours(-1), DateTimeOffset.UtcNow, 100);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsAuthorized);
        Assert.True(result.IsNotFound);
        Assert.Null(result.Value);
    }

    private sealed class FakeTelemetryQueryRepository : ITelemetryQueryRepository
    {
        public bool ReturnNullChart { get; set; }

        public Task<IReadOnlyList<TelemetryPoint>> GetAsync(
            Guid organizationId, Guid? regionId, TelemetryQuery query, CancellationToken cancellationToken)
        {
            var point = new TelemetryPoint("100", Guid.NewGuid(), 1, DateTime.UtcNow, 42.5m, "m3/h", "VALID", false);
            return Task.FromResult<IReadOnlyList<TelemetryPoint>>([point]);
        }

        public Task<IReadOnlyList<ChartPoint>?> GetChartAsync(
            Guid organizationId, Guid? regionId, ChartQuery query, CancellationToken cancellationToken)
        {
            if (ReturnNullChart) return Task.FromResult<IReadOnlyList<ChartPoint>?>(null);

            var point = new ChartPoint(100L, 1, DateTime.UtcNow, 42.5m, "m3/h", "VALID", false);
            return Task.FromResult<IReadOnlyList<ChartPoint>?>([point]);
        }
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "telemetry@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
