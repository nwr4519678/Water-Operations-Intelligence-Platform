using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Seeding;

public static class ViewerSeed
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public static async Task SeedAsync(WaterOperationsDbContext db, CancellationToken ct = default)
    {
        await Gate.WaitAsync(ct);
        try
        {
            if (await db.Organizations.AnyAsync(ct))
            {
                return;
            }

            var org = new Organization
            {
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Synthetic Water Utility",
                Slug = "synthetic-water-utility",
                DefaultLocale = "en",
                DefaultTimeZone = "UTC"
            };
            var parameter = new Parameter
            {
                Code = "WATER_LEVEL",
                Name = "Water Level",
                CanonicalUnit = "m",
                DataType = "DECIMAL",
                IsActive = true
            };
            var alarmType = new AlarmType { Code = "ANOMALY", Name = "Statistical anomaly" };
            var regions = Enumerable.Range(1, 2)
                .Select(i => new Region
                {
                    RegionId = Guid.NewGuid(),
                    OrganizationId = org.OrganizationId,
                    Code = $"R{i}",
                    Name = $"Region {i}"
                })
                .ToList();
            var stations = regions
                .SelectMany(
                    (region, regionIndex) => Enumerable.Range(1, 2)
                        .Select(
                            stationIndex => new Station
                            {
                                StationId = Guid.NewGuid(),
                                OrganizationId = org.OrganizationId,
                                RegionId = region.RegionId,
                                StationCode = $"ST-{regionIndex + 1}-{stationIndex}",
                                Name = $"Station {regionIndex + 1}.{stationIndex}",
                                Status = "ONLINE"
                            }))
                .ToList();
            var stationParameters = stations
                .Select(station => new StationParameter
                {
                    StationId = station.StationId,
                    ParameterId = parameter.ParameterId,
                    SourceUnit = "m"
                })
                .ToList();
            db.AddRange(org, parameter, alarmType);
            db.AddRange(regions);
            db.AddRange(stations);
            await db.SaveChangesAsync(ct);
            stationParameters = stations
                .Select(station => new StationParameter
                {
                    StationId = station.StationId,
                    ParameterId = parameter.ParameterId,
                    SourceUnit = "m"
                })
                .ToList();
            var measurements = stations
                .SelectMany(
                    (station, i) => Enumerable.Range(1, 3)
                        .Select(
                            n => new MeasurementClean
                            {
                                OrganizationId = org.OrganizationId,
                                StationId = station.StationId,
                                ParameterId = parameter.ParameterId,
                                TimestampUtc = new DateTime(2025, 1, n, 0, 0, 0, DateTimeKind.Utc),
                                Value = 40 + i + n / 10m,
                                CanonicalUnit = "m",
                                QualityFlag = "VALID",
                                CleaningRulesetVersion = "seed-v1"
                            }))
                .ToList();
            var alarms = stations.Select((station, i) => new Alarm
            {
                OrganizationId = org.OrganizationId,
                StationId = station.StationId,
                AlarmTypeId = alarmType.AlarmTypeId,
                RaisedAtUtc = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                Severity = i % 2 == 0 ? "INFO" : "WARNING",
                Status = "ACTIVE",
                Message = "Synthetic local development alarm"
            }).ToList();
            db.AddRange(stationParameters);
            db.AddRange(measurements);
            db.AddRange(alarms);
            await db.SaveChangesAsync(ct);
        }
        finally
        {
            Gate.Release();
        }
    }
}
