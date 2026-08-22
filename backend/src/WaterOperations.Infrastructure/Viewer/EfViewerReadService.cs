using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfViewerReadService(WaterOperationsDbContext db, ITenantContext tenant) : IViewerReadService
{
    public async Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken cancellationToken) =>
        await db.Organizations.AsNoTracking().Where(x => tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId).OrderBy(x => x.Name)
            .Select(x => new OrganizationDto(x.OrganizationId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RegionDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        await db.Regions.AsNoTracking().Where(x => x.OrganizationId == organizationId && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId)).OrderBy(x => x.Name)
            .Select(x => new RegionDto(x.RegionId, x.OrganizationId, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StationDto>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) =>
        await db.Stations.AsNoTracking().Where(x => x.RegionId == regionId && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId)).OrderBy(x => x.Name)
            .Select(x => new StationDto(x.StationId, x.RegionId!.Value, x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken)
    {
        var rows = await db.MeasurementCleans.AsNoTracking()
            .Where(x => x.StationId == stationId && x.QualityFlag != "QUARANTINED" && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId))
            .OrderByDescending(x => x.TimestampUtc).ToListAsync(cancellationToken);
        return rows.Select(x => new MeasurementDto(x.MeasurementCleanId, x.StationId,
            new DateTimeOffset(DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc)), x.Value ?? 0m, x.CanonicalUnit)).ToList();
    }

    public async Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken)
    {
        var rows = await db.Alarms.AsNoTracking().Where(x => x.StationId == stationId && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId))
            .OrderByDescending(x => x.RaisedAtUtc).ToListAsync(cancellationToken);
        return rows.Select(x => new AlarmDto(x.AlarmId, x.StationId,
            new DateTimeOffset(DateTime.SpecifyKind(x.RaisedAtUtc, DateTimeKind.Utc)), x.Severity, x.Message)).ToList();
    }

    public async Task<PagedResult<StationSearchDto>> SearchStationsAsync(Guid? regionId, string? search, string? status, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = Math.Clamp(page, 1, 10000);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Stations.AsNoTracking().Where(x => tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId);
        if (regionId is Guid region) query = query.Where(x => x.RegionId == region);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Name.Contains(search) || x.StationCode.Contains(search));
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.StationId).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new StationSearchDto(x.StationId, x.RegionId, x.StationCode, x.Name, x.Status, x.Latitude, x.Longitude, x.LastSeenAtUtc, x.IsActive)).ToListAsync(cancellationToken);
        return new PagedResult<StationSearchDto>(items, page, pageSize, total);
    }

    public async Task<StationDetailDto?> GetStationDetailAsync(Guid stationId, CancellationToken cancellationToken)
    {
        var station = await db.Stations.AsNoTracking().Include(x => x.StationParameters).ThenInclude(x => x.Parameter)
            .Include(x => x.StationConnections).SingleOrDefaultAsync(x => x.StationId == stationId && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId), cancellationToken);
        if (station is null) return null;
        var links = await db.StationLinks.AsNoTracking().Where(x => (x.FromStationId == stationId || x.ToStationId == stationId) && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId))
            .Select(x => new StationLinkDto(x.StationLinkId, x.FromStationId, x.ToStationId, x.LinkType, x.DistanceMeters, x.FlowDirection, x.IsActive)).ToListAsync(cancellationToken);
        return new StationDetailDto(station.StationId, station.OrganizationId, station.RegionId, station.StationCode, station.Name, station.Description, station.Latitude, station.Longitude, station.ElevationMeters, station.Status, station.LastSeenAtUtc, station.IsActive,
            station.StationParameters.Where(x => x.Parameter != null).Select(x => new StationParameterDto(x.ParameterId, x.Parameter.Code, x.Parameter.Name, x.Parameter.CanonicalUnit, x.IsEnabled)).ToList(),
            station.StationConnections.Select(x => new StationConnectionDto(x.StationConnectionId, x.Protocol, x.DeviceIdentifier, x.FirmwareVersion, x.SignalStrength, x.BatteryVoltage, x.IsPrimary, x.IsActive, x.LastConnectedAtUtc)).ToList(), links);
    }

    public async Task<PagedResult<ChartMeasurementDto>> QueryMeasurementsAsync(Guid stationId, int? parameterId, DateTime? fromUtc, DateTime? toUtc, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = Math.Clamp(page, 1, 10000); pageSize = Math.Clamp(pageSize, 1, 1000);
        var query = db.MeasurementCleans.AsNoTracking().Where(x => x.StationId == stationId && x.QualityFlag != "QUARANTINED" && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId));
        if (parameterId is int parameter) query = query.Where(x => x.ParameterId == parameter);
        if (fromUtc is DateTime from) query = query.Where(x => x.TimestampUtc >= DateTime.SpecifyKind(from, DateTimeKind.Utc));
        if (toUtc is DateTime to) query = query.Where(x => x.TimestampUtc <= DateTime.SpecifyKind(to, DateTimeKind.Utc));
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.TimestampUtc).ThenBy(x => x.MeasurementCleanId).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ChartMeasurementDto(x.MeasurementCleanId, x.StationId, x.ParameterId, new DateTimeOffset(DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc)), x.Value ?? 0m, x.CanonicalUnit, x.QualityFlag)).ToListAsync(cancellationToken);
        return new PagedResult<ChartMeasurementDto>(items, page, pageSize, total);
    }
}
