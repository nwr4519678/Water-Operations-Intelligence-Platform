using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfOverviewService(WaterOperationsDbContext db, ITenantContext tenant) : IOverviewService
{
    public async Task<OverviewDto> GetAsync(DateTimeOffset? asOfUtc, CancellationToken cancellationToken)
    {
        var asOf = asOfUtc ?? DateTimeOffset.UtcNow;
        var organizationId = tenant.OrganizationId;
        var stations = db.Stations.AsNoTracking().Where(station => organizationId == null || station.OrganizationId == organizationId);
        var alarms = db.Alarms.AsNoTracking().Where(alarm => organizationId == null || alarm.OrganizationId == organizationId);
        var measurements = db.MeasurementCleans.AsNoTracking().Where(row => organizationId == null || row.OrganizationId == organizationId);
        var total = await stations.CountAsync(cancellationToken);
        var online = await stations.CountAsync(station => station.Status == "ONLINE", cancellationToken);
        var openAlarms = await alarms.CountAsync(alarm => alarm.Status != "RESOLVED", cancellationToken);
        var recentMeasurements = await measurements.CountAsync(row => row.TimestampUtc <= asOf.UtcDateTime && row.TimestampUtc > asOf.UtcDateTime.AddHours(-24), cancellationToken);
        return new OverviewDto(asOf, total, online, total - online, openAlarms, recentMeasurements, "operational");
    }
}
