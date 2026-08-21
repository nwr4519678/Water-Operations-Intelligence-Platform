using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfTelemetryReadService(WaterOperationsDbContext db) : ITelemetryReadService
{
    public async Task<IReadOnlyList<TelemetryScopeRecord>> GetAsync(string organization, string region, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(organization, out var organizationId)) return [];
        var query = db.MeasurementCleans.AsNoTracking()
            .Where(row => row.OrganizationId == organizationId && row.QualityFlag != "QUARANTINED");
        if (Guid.TryParse(region, out var regionId)) query = query.Where(row => db.Stations.Any(station => station.StationId == row.StationId && station.RegionId == regionId));

        return await query.OrderByDescending(row => row.TimestampUtc).Take(500)
            .Select(row => new TelemetryScopeRecord(row.MeasurementCleanId.ToString(), organization, region,
                (double)(row.Value ?? 0m), row.TimestampUtc, row.QualityFlag))
            .ToListAsync(cancellationToken);
    }
}
