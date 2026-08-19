using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfViewerReadService(WaterOperationsDbContext db) : IViewerReadService
{
    public async Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken) =>
        await db.Organizations.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new OrganizationDto(x.Id, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        await db.Regions.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.Name)
            .Select(x => new RegionDto(x.Id, x.OrganizationId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) =>
        await db.Stations.AsNoTracking().Where(x => x.RegionId == regionId).OrderBy(x => x.Name)
            .Select(x => new StationDto(x.Id, x.RegionId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken) =>
        await db.Measurements.AsNoTracking().Where(x => x.StationId == stationId).OrderByDescending(x => x.RecordedAt)
            .Select(x => new MeasurementDto(x.Id, x.StationId, x.RecordedAt, x.Value, x.Unit)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken) =>
        await db.Alarms.AsNoTracking().Where(x => x.StationId == stationId).OrderByDescending(x => x.RaisedAt)
            .Select(x => new AlarmDto(x.Id, x.StationId, x.RaisedAt, x.Severity, x.Message)).ToListAsync(cancellationToken);
}
