namespace WaterOperations.Application.Common.Security;

public interface IStationAuthorizationService
{
    Task<bool> CanAccessStationAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessRegionAsync(Guid regionId, CancellationToken cancellationToken = default);
    Task DirectGuardStationAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task DirectGuardRegionAsync(Guid regionId, CancellationToken cancellationToken = default);
}
