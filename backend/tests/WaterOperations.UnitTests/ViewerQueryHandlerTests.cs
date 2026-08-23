using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Application.Features.Viewer.Queries;

namespace WaterOperations.UnitTests;

public sealed class ViewerQueryHandlerTests
{
    [Fact]
    public async Task GetRegionsQueryForwardsScopeAndCancellationToReadPort()
    {
        var organizationId = Guid.NewGuid();
        using var cancellationSource = new CancellationTokenSource();
        var expected = new[] { new RegionDto(Guid.NewGuid(), organizationId, "North") };
        var readService = new RecordingViewerReadService(expected);
        var currentUser = new FakeCurrentUser(organizationId);
        var handler = new GetRegionsQueryHandler(readService, currentUser);

        var result = await handler.Handle(new GetRegionsQuery(), cancellationSource.Token);

        Assert.True(result.IsAuthorized);
        Assert.Equal(expected, result.Value);
        Assert.Equal(organizationId, readService.OrganizationId);
        Assert.Equal(cancellationSource.Token, readService.CancellationToken);
    }

    private sealed class RecordingViewerReadService(IReadOnlyList<RegionDto> regions) : IViewerQueryRepository
    {
        public Guid OrganizationId { get; private set; }
        public CancellationToken CancellationToken { get; private set; }

        public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(Guid organizationId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OrganizationDto>>([]);

        public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid currentOrganizationId, Guid organizationId, CancellationToken cancellationToken)
        {
            OrganizationId = organizationId;
            CancellationToken = cancellationToken;
            return Task.FromResult(regions);
        }

        public Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid organizationId, Guid regionId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<StationDto>>([]);

        public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid organizationId, Guid stationId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MeasurementDto>>([]);

        public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid organizationId, Guid stationId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<AlarmDto>>([]);

        public Task<PagedResult<AlarmDto>> SearchAlarmsAsync(Guid organizationId, Guid? stationId, string? severity, string? status, PaginationRequest pagination, CancellationToken cancellationToken) =>
            Task.FromResult(new PagedResult<AlarmDto>([], 0, 1, 50));

        public Task<AlarmDto?> GetAlarmAsync(Guid organizationId, Guid alarmId, CancellationToken cancellationToken) =>
            Task.FromResult<AlarmDto?>(null);
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "viewer@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
