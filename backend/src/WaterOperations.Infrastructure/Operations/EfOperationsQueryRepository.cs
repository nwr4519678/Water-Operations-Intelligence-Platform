using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Operations;

public sealed class EfOperationsQueryRepository(IRepositoryContext repository) : IOperationsQueryRepository
{
    public async Task<OperationsOverviewDto> GetOverviewAsync(
        Guid organizationId,
        Guid? regionId,
        DateTimeOffset? asOf,
        CancellationToken cancellationToken)
    {
        var stations = repository.Query<Station>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.IsActive);
        if (regionId.HasValue)
        {
            stations = stations.Where(x => x.RegionId == regionId);
        }

        var openAlarms = repository.Query<Alarm>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.Status != "RESOLVED");
        if (regionId.HasValue)
        {
            openAlarms = openAlarms.Where(x => x.Station.RegionId == regionId);
        }

        var latest = repository.Query<MeasurementClean>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.QualityFlag != "QUARANTINED");
        if (regionId.HasValue)
        {
            latest = latest.Where(x => x.StationParameter.Station.RegionId == regionId);
        }

        var cutoff = (asOf ?? DateTimeOffset.UtcNow).UtcDateTime;
        var stationCount = await stations.CountAsync(cancellationToken);
        var onlineCount = await stations.CountAsync(x => x.Status == "ONLINE", cancellationToken);
        var alarmCount = await openAlarms.CountAsync(cancellationToken);
        var telemetry = await latest
            .OrderByDescending(x => x.TimestampUtc)
            .ThenByDescending(x => x.MeasurementCleanId)
            .Take(20)
            .Select(x => new LatestTelemetryDto(
                x.StationId,
                x.ParameterId,
                DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc),
                x.Value,
                x.CanonicalUnit,
                x.QualityFlag))
            .ToListAsync(cancellationToken);
        return new OperationsOverviewDto(
            cutoff,
            stationCount,
            onlineCount,
            stationCount - onlineCount,
            alarmCount,
            telemetry);
    }

    public async Task<PagedResult<DataQualityDto>> GetDataQualityAsync(
        Guid organizationId,
        Guid? regionId,
        DateTimeOffset? from,
        DateTimeOffset? until,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = repository.Query<DataQualityLog>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);
        if (regionId.HasValue)
        {
            query = query.Where(x => x.Station.RegionId == regionId);
        }

        if (from.HasValue)
        {
            query = query.Where(x => x.WindowEndUtc >= from.Value.UtcDateTime);
        }

        if (until.HasValue)
        {
            query = query.Where(x => x.WindowStartUtc <= until.Value.UtcDateTime);
        }

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(x => x.WindowEndUtc)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new DataQualityDto(
                x.StationId,
                x.WindowStartUtc,
                x.WindowEndUtc,
                x.TotalCount,
                x.ValidCount,
                x.InterpolatedCount,
                x.QuarantinedCount,
                x.DuplicateCount,
                x.ValidPct,
                x.InterpolatedPct,
                x.QuarantinedPct,
                x.SchemaDriftEvents,
                x.RulesetVersion))
            .ToListAsync(cancellationToken);

        return new PagedResult<DataQualityDto>(
            rows,
            pagination.Page,
            pagination.PageSize,
            total);
    }
}
