using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Telemetry.Repositories;

public sealed class TelemetryQueryRepository(IRepositoryContext repository)
    : ITelemetryQueryRepository
{
    public async Task<IReadOnlyList<TelemetryPoint>> GetAsync(
        Guid organizationId,
        Guid? regionId,
        TelemetryQuery query,
        CancellationToken cancellationToken)
    {
        var take = Math.Clamp(query.Limit ?? 100, 1, 1000);
        var measurements = repository.Query<MeasurementClean>()
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                x.QualityFlag != "QUARANTINED");

        if (regionId.HasValue)
        {
            measurements = measurements.Where(x => x.StationParameter.Station.RegionId == regionId);
        }

        if (query.StationId.HasValue)
        {
            measurements = measurements.Where(x => x.StationId == query.StationId.Value);
        }

        if (query.ParameterId.HasValue)
        {
            measurements = measurements.Where(x => x.ParameterId == query.ParameterId.Value);
        }

        if (query.From.HasValue)
        {
            measurements = measurements.Where(x => x.TimestampUtc >= query.From.Value.UtcDateTime);
        }

        if (query.To.HasValue)
        {
            measurements = measurements.Where(x => x.TimestampUtc <= query.To.Value.UtcDateTime);
        }

        return await measurements
            .OrderByDescending(x => x.TimestampUtc)
            .ThenByDescending(x => x.MeasurementCleanId)
            .Take(take)
            .Select(x => new TelemetryPoint(
                x.MeasurementCleanId.ToString(CultureInfo.InvariantCulture),
                x.StationId,
                x.ParameterId,
                DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc),
                x.Value,
                x.CanonicalUnit,
                x.QualityFlag,
                x.IsInterpolated))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ChartPoint>?> GetChartAsync(
        Guid organizationId,
        Guid? regionId,
        ChartQuery query,
        CancellationToken cancellationToken)
    {
        var stationAllowed = await repository.Query<Station>()
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.StationId == query.StationId &&
                    x.OrganizationId == organizationId &&
                    (!regionId.HasValue || x.RegionId == regionId),
                cancellationToken);
        if (!stationAllowed)
        {
            return null;
        }

        var measurements = repository.Query<MeasurementClean>()
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                x.StationId == query.StationId &&
                x.TimestampUtc >= query.From.UtcDateTime &&
                x.TimestampUtc <= query.To.UtcDateTime &&
                x.QualityFlag != "QUARANTINED");
        if (query.ParameterIds.Length > 0)
        {
            measurements = measurements.Where(x => query.ParameterIds.Contains(x.ParameterId));
        }

        return await measurements
            .OrderBy(x => x.TimestampUtc)
            .ThenBy(x => x.ParameterId)
            .ThenBy(x => x.MeasurementCleanId)
            .Take(Math.Clamp(query.Limit, 1, 10000))
            .Select(x => new ChartPoint(
                x.MeasurementCleanId,
                x.ParameterId,
                DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc),
                x.Value,
                x.CanonicalUnit,
                x.QualityFlag,
                x.IsInterpolated))
            .ToListAsync(cancellationToken);
    }
}
