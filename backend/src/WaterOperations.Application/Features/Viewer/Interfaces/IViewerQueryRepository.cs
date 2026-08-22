using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Common.Pagination;

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
