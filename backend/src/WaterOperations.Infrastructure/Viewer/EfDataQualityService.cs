using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Viewer;

public sealed class EfDataQualityService(WaterOperationsDbContext db) : IDataQualityService
{
    public async Task<IReadOnlyList<DataQualityDto>> ReadAsync(DateTimeOffset? fromUtc, DateTimeOffset? toUtc, CancellationToken cancellationToken)
    {
        var query = db.VwDataQualityLatests.AsNoTracking();
        if (fromUtc is not null) query = query.Where(row => row.WindowEndUtc >= fromUtc.Value.UtcDateTime);
        if (toUtc is not null) query = query.Where(row => row.WindowStartUtc <= toUtc.Value.UtcDateTime);
        return await query.OrderByDescending(row => row.WindowEndUtc).Take(500)
            .Select(row => new DataQualityDto(row.OrganizationId, row.StationId, row.StationCode, row.StationName, row.WindowStartUtc, row.WindowEndUtc, row.TotalCount, row.ValidCount, row.InterpolatedCount, row.QuarantinedCount, row.DuplicateCount, row.ValidPct, row.InterpolatedPct, row.QuarantinedPct, row.SchemaDriftEvents, row.RulesetVersion))
            .ToListAsync(cancellationToken);
    }
}
