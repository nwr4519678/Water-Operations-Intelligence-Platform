using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Stations.DTOs;
using WaterOperations.Application.Features.Stations.Interfaces;
using WaterOperations.Application.Features.Stations.Queries;

namespace WaterOperations.UnitTests;

public sealed class StationQueryTests
{
    private readonly FakeStationQueryRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task SearchStationsQueryHandler_CallsRepositoryAndReturnsAuthorized()
    {
        var handler = new SearchStationsQueryHandler(repository, user);
        var query = new SearchStationsQuery("Pump", null, "ACTIVE", new PaginationRequest(1, 10));

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value.Data);
        Assert.Equal("Pump Station 1", result.Value.Data[0].Name);
    }

    [Fact]
    public async Task GetStationQueryHandler_ExistingStation_ReturnsAuthorizedDetails()
    {
        var stationId = Guid.NewGuid();
        var orgId = user.OrganizationId!.Value;
        repository.Stations[stationId] = new StationDetailsDto(
            stationId, orgId, null, "ST-01", "Main Station", "Description", 12.34m, 56.78m, 100m, "ACTIVE", DateTime.UtcNow, true, []);

        var handler = new GetStationQueryHandler(repository, user);
        var result = await handler.Handle(new GetStationQuery(stationId), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal(stationId, result.Value.StationId);
    }

    [Fact]
    public async Task GetStationQueryHandler_NonExistentStation_ReturnsNotFound()
    {
        var handler = new GetStationQueryHandler(repository, user);
        var result = await handler.Handle(new GetStationQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsAuthorized);
        Assert.True(result.IsNotFound);
        Assert.Null(result.Value);
    }

    private sealed class FakeStationQueryRepository : IStationQueryRepository
    {
        public Dictionary<Guid, StationDetailsDto> Stations { get; } = [];

        public Task<PagedResult<StationListItemDto>> SearchAsync(
            Guid organizationId, StationSearchRequest request, CancellationToken cancellationToken)
        {
            var item = new StationListItemDto(Guid.NewGuid(), organizationId, request.RegionId, "ST-01", "Pump Station 1", 10.0m, 20.0m, "ACTIVE", DateTime.UtcNow, true);
            return Task.FromResult(new PagedResult<StationListItemDto>([item], 1, 1, 10));
        }

        public Task<StationDetailsDto?> GetAsync(Guid organizationId, Guid stationId, CancellationToken cancellationToken) =>
            Task.FromResult(Stations.TryGetValue(stationId, out var value) ? value : null);
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "station@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
