using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IViewerQueryRepository
{
    Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(
        Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<RegionDto>> GetRegionsAsync(
        Guid currentOrganizationId,
        Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<StationDto>> GetStationsAsync(
        Guid organizationId,
        Guid regionId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken);

    Task<PagedResult<AlarmDto>> SearchAlarmsAsync(
        Guid organizationId,
        Guid? stationId,
        string? severity,
        string? status,
        PaginationRequest pagination,
        CancellationToken cancellationToken);

    Task<AlarmDto?> GetAlarmAsync(
        Guid organizationId,
        Guid alarmId,
        CancellationToken cancellationToken);
}
