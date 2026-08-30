using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Application.Features.Operations.Queries;

namespace WaterOperations.UnitTests;

public sealed class OperationsQueryTests
{
    private readonly FakeOperationsQueryRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task GetOperationsOverviewQueryHandler_ReturnsOverviewDto()
    {
        var handler = new GetOperationsOverviewQueryHandler(repository, user);
        var query = new GetOperationsOverviewQuery(DateTimeOffset.UtcNow);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal(10, result.Value.StationCount);
        Assert.Equal(8, result.Value.OnlineCount);
    }

    [Fact]
    public async Task GetDataQualityQueryHandler_ReturnsPagedDataQuality()
    {
        var handler = new GetDataQualityQueryHandler(repository, user);
        var query = new GetDataQualityQuery(null, null, new PaginationRequest(1, 10));

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value.Data);
        Assert.Equal(98.5m, result.Value.Data[0].ValidPct);
    }

    private sealed class FakeOperationsQueryRepository : IOperationsQueryRepository
    {
        public Task<OperationsOverviewDto> GetOverviewAsync(
            Guid organizationId, Guid? regionId, DateTimeOffset? asOf, CancellationToken cancellationToken) =>
            Task.FromResult(new OperationsOverviewDto(DateTime.UtcNow, 10, 8, 2, 0, []));

        public Task<PagedResult<DataQualityDto>> GetDataQualityAsync(
            Guid organizationId, Guid? regionId, DateTimeOffset? from, DateTimeOffset? to, PaginationRequest pagination, CancellationToken cancellationToken)
        {
            var item = new DataQualityDto(Guid.NewGuid(), DateTime.UtcNow.AddDays(-1), DateTime.UtcNow, 100, 98, 1, 1, 0, 98.5m, 1.0m, 0.5m, 0, "v1");
            return Task.FromResult(new PagedResult<DataQualityDto>([item], 1, 1, 10));
        }
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "ops@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
