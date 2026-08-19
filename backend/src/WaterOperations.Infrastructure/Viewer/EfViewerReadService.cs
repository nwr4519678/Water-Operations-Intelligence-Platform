using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Viewer;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfViewerReadService(WaterOperationsDbContext db) : IViewerReadService
{
    public async Task<IReadOnlyList<Organization>> GetOrganizationsAsync(CancellationToken cancellationToken) => await db.Organizations.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<Region>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) => await db.Regions.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.Name).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<Station>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) => await db.Stations.AsNoTracking().Where(x => x.RegionId == regionId).OrderBy(x => x.Name).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<Measurement>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken) => await db.Measurements.AsNoTracking().Where(x => x.StationId == stationId).OrderByDescending(x => x.RecordedAt).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<Alarm>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken) => await db.Alarms.AsNoTracking().Where(x => x.StationId == stationId).OrderByDescending(x => x.RaisedAt).ToListAsync(cancellationToken);
}
