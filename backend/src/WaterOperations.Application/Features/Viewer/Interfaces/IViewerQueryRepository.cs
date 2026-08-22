using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Common.Pagination;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IViewerQueryRepository
{
    public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<OrganizationDto>>([]);
    public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(
        Guid organizationId,
        CancellationToken cancellationToken) => GetOrganizationsAsync(cancellationToken);

    public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<RegionDto>>([]);

    public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(
        Guid currentOrganizationId,
        Guid organizationId,
        CancellationToken cancellationToken) => GetRegionsAsync(organizationId, cancellationToken);

    public Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StationDto>>([]);

    public Task<IReadOnlyList<StationDto>> GetStationsAsync(
        Guid organizationId,
        Guid regionId,
        CancellationToken cancellationToken) => GetStationsAsync(regionId, cancellationToken);

    public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<MeasurementDto>>([]);

    public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken) => GetMeasurementsAsync(stationId, cancellationToken);

    public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AlarmDto>>([]);

    public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken) => GetAlarmsAsync(stationId, cancellationToken);

    public Task<PagedResult<AlarmDto>> SearchAlarmsAsync(
        Guid organizationId,
        Guid? stationId,
        string? severity,
        string? status,
        PaginationRequest pagination,
        CancellationToken cancellationToken) =>
        Task.FromResult(new PagedResult<AlarmDto>([], 1, 50, 0));

    public Task<AlarmDto?> GetAlarmAsync(
        Guid organizationId,
        Guid alarmId,
        CancellationToken cancellationToken) => Task.FromResult<AlarmDto?>(null);
}
