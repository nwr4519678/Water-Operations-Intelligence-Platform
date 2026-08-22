using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IViewerReadService
{
    Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken);
    Task<PagedResult<StationSearchDto>> SearchStationsAsync(Guid? regionId, string? search, string? status, int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
    Task<StationDetailDto?> GetStationDetailAsync(Guid stationId, CancellationToken cancellationToken) => throw new NotSupportedException();
    Task<PagedResult<ChartMeasurementDto>> QueryMeasurementsAsync(Guid stationId, int? parameterId, DateTime? fromUtc, DateTime? toUtc, int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
}
