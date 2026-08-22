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
        var handler = new GetRegionsQueryHandler(readService);

        var result = await handler.Handle(new GetRegionsQuery(organizationId), cancellationSource.Token);

        Assert.Equal(expected, result);
        Assert.Equal(organizationId, readService.OrganizationId);
        Assert.Equal(cancellationSource.Token, readService.CancellationToken);
    }

    private sealed class RecordingViewerReadService(IReadOnlyList<RegionDto> regions) : IViewerQueryRepository
    {
        public Guid OrganizationId { get; private set; }
        public CancellationToken CancellationToken { get; private set; }

        public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<OrganizationDto>>([]);
        public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken)
        {
            OrganizationId = organizationId;
            CancellationToken = cancellationToken;
            return Task.FromResult(regions);
        }
        public Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StationDto>>([]);
        public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<MeasurementDto>>([]);
        public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AlarmDto>>([]);
    }
}
