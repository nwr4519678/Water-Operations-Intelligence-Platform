using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IViewerQueryRepository
{
    public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(
        CancellationToken cancellationToken);

    public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(
        Guid organizationId,
        CancellationToken cancellationToken);

    public Task<IReadOnlyList<StationDto>> GetStationsAsync(
        Guid regionId,
        CancellationToken cancellationToken);

    public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(
        Guid stationId,
        CancellationToken cancellationToken);

    public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(
        Guid stationId,
        CancellationToken cancellationToken);
}
