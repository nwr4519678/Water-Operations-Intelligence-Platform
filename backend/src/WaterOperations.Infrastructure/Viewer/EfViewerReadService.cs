using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfViewerReadService(WaterOperationsDbContext db) : IViewerReadService
{
    public async Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken) =>
        await db.Organizations.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new OrganizationDto(x.OrganizationId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        await db.Regions.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.Name)
            .Select(x => new RegionDto(x.RegionId, x.OrganizationId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) =>
        await db.Stations.AsNoTracking().Where(x => x.RegionId == regionId).OrderBy(x => x.Name)
            .Select(x => new StationDto(x.StationId, x.RegionId!.Value, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken)
    {
        var rows = await db.MeasurementCleans.AsNoTracking()
            .Where(x => x.StationId == stationId && x.QualityFlag != "QUARANTINED")
            .OrderByDescending(x => x.TimestampUtc).ToListAsync(cancellationToken);
        return rows.Select(x => new MeasurementDto(x.MeasurementCleanId, x.StationId,
            new DateTimeOffset(DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc)), x.Value ?? 0m, x.CanonicalUnit)).ToList();
    }

    public async Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken)
    {
        var rows = await db.Alarms.AsNoTracking().Where(x => x.StationId == stationId)
            .OrderByDescending(x => x.RaisedAtUtc).ToListAsync(cancellationToken);
        return rows.Select(x => new AlarmDto(x.AlarmId, x.StationId,
            new DateTimeOffset(DateTime.SpecifyKind(x.RaisedAtUtc, DateTimeKind.Utc)), x.Severity, x.Message)).ToList();
    }
}
