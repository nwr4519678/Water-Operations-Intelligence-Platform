using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Seeding;

public static class ViewerSeed
{
    public static async Task SeedAsync(WaterOperationsDbContext db, CancellationToken ct = default)
    {
        if (await db.Organizations.AnyAsync(ct)) return;
        var org = new Organization { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Synthetic Water Utility" };
        var regions = Enumerable.Range(1, 2).Select(i => new Region { Id = Guid.Parse($"22222222-2222-2222-2222-22222222222{i}"), OrganizationId = org.Id, Name = $"Region {i}" }).ToList();
        var stations = regions.SelectMany((region, regionIndex) => Enumerable.Range(1, 2).Select(stationIndex => new Station { Id = Guid.Parse($"33333333-3333-3333-3333-3333333333{regionIndex}{stationIndex}"), RegionId = region.Id, Name = $"Station {regionIndex + 1}.{stationIndex}" })).ToList();
        var measurements = stations.SelectMany((station, i) => Enumerable.Range(1, 3).Select(n => new Measurement { Id = Guid.Parse($"44444444-4444-4444-4444-4444444444{i}{n}"), StationId = station.Id, RecordedAt = new DateTimeOffset(2025, 1, n, 0, 0, 0, TimeSpan.Zero), Value = 40 + i + n / 10m, Unit = "m3/h" })).ToList();
        var alarms = stations.Select((station, i) => new Alarm { Id = Guid.Parse($"55555555-5555-5555-5555-55555555555{i}"), StationId = station.Id, RaisedAt = new DateTimeOffset(2025, 1, 10, 0, 0, 0, TimeSpan.Zero), Severity = i % 2 == 0 ? "Info" : "Warning", Message = "Synthetic local development alarm" }).ToList();
        db.Add(org); db.AddRange(regions); db.AddRange(stations); db.AddRange(measurements); db.AddRange(alarms); await db.SaveChangesAsync(ct);
    }
}
