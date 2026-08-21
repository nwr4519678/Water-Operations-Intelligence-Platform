using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IViewerReadService
{
    Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken);
}
