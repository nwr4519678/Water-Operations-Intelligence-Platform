using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Viewer;

public interface IViewerReadService
{
    Task<IReadOnlyList<Organization>> GetOrganizationsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<Region>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Station>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Measurement>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Alarm>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken);
}
