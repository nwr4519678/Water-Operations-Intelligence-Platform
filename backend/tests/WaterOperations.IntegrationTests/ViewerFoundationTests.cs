using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;

namespace WaterOperations.IntegrationTests;

public class ViewerFoundationTests
{
    private sealed class ThrowingViewerReadService : IViewerQueryRepository
    {
        public Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(Guid organizationId, CancellationToken cancellationToken) => throw new InvalidOperationException("boom");
        public Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid currentOrganizationId, Guid organizationId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid organizationId, Guid regionId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid organizationId, Guid stationId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid organizationId, Guid stationId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<PagedResult<AlarmDto>> SearchAlarmsAsync(Guid organizationId, Guid? stationId, string? severity, string? status, PaginationRequest pagination, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<AlarmDto?> GetAlarmAsync(Guid organizationId, Guid alarmId, CancellationToken cancellationToken) => throw new NotImplementedException();
    }
}
