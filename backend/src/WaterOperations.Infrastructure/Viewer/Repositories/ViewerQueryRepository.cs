using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Viewer.Repositories;

public sealed class ViewerQueryRepository(IRepositoryContext repository) : IViewerQueryRepository
{
    public async Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        return await repository.Query<Organization>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderBy(x => x.Name)
            .Select(x => new OrganizationDto(x.OrganizationId, x.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RegionDto>> GetRegionsAsync(
        Guid currentOrganizationId,
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        return await repository.Query<Region>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == currentOrganizationId && x.OrganizationId == organizationId)
            .OrderBy(x => x.Name)
            .Select(x => new RegionDto(x.RegionId, x.OrganizationId, x.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StationDto>> GetStationsAsync(
        Guid organizationId,
        Guid regionId,
        CancellationToken cancellationToken)
    {
        return await repository.Query<Station>()
            .AsNoTracking()
            .Where(x => x.RegionId == regionId && x.OrganizationId == organizationId)
            .OrderBy(x => x.Name)
            .Select(x => new StationDto(x.StationId, x.RegionId!.Value, x.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MeasurementDto>> GetMeasurementsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken)
    {
        var stationExists = await repository.Query<Station>()
            .AnyAsync(x => x.OrganizationId == organizationId && x.StationId == stationId, cancellationToken);

        if (!stationExists)
        {
            return [];
        }

        var rows = await repository.Query<MeasurementClean>()
            .AsNoTracking()
            .Where(x => x.StationId == stationId && x.QualityFlag != "QUARANTINED")
            .OrderByDescending(x => x.TimestampUtc)
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new MeasurementDto(
                x.MeasurementCleanId,
                x.StationId,
                new DateTimeOffset(DateTime.SpecifyKind(x.TimestampUtc, DateTimeKind.Utc)),
                x.Value ?? 0m,
                x.CanonicalUnit))
            .ToList();
    }

    public async Task<IReadOnlyList<AlarmDto>> GetAlarmsAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken)
    {
        var rows = await repository.Query<Alarm>()
            .AsNoTracking()
            .Where(x => x.StationId == stationId && x.OrganizationId == organizationId
                && !x.Message.StartsWith("Synthetic"))
            .Include(x => x.Station)
            .Include(x => x.AlarmType)
            .Include(x => x.AcknowledgedByUser)
            .Include(x => x.ResolvedByUser)
            .OrderByDescending(x => x.RaisedAtUtc)
            .ToListAsync(cancellationToken);

        return rows
            .Select(ToDto)
            .ToList();
    }

    public async Task<PagedResult<AlarmDto>> SearchAlarmsAsync(
        Guid organizationId,
        Guid? stationId,
        string? severity,
        string? status,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = repository.Query<Alarm>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId
                && !x.Message.StartsWith("Synthetic"));

        if (stationId.HasValue)
        {
            query = query.Where(x => x.StationId == stationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(severity))
        {
            query = query.Where(x => x.Severity == severity);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var data = await query
            .OrderByDescending(x => x.RaisedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(x => x.Station)
            .Include(x => x.AlarmType)
            .Include(x => x.AcknowledgedByUser)
            .Include(x => x.ResolvedByUser)
            .ToListAsync(cancellationToken);

        return new PagedResult<AlarmDto>(data.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<AlarmDto?> GetAlarmAsync(
        Guid organizationId,
        Guid alarmId,
        CancellationToken cancellationToken)
    {
        var alarm = await repository.Query<Alarm>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.AlarmId == alarmId
                && !x.Message.StartsWith("Synthetic"))
            .Include(x => x.Station)
            .Include(x => x.AlarmType)
            .Include(x => x.AcknowledgedByUser)
            .Include(x => x.ResolvedByUser)
            .SingleOrDefaultAsync(cancellationToken);

        return alarm is null ? null : ToDto(alarm);
    }

    private static AlarmDto ToDto(Alarm x) => new(
        x.AlarmId,
        x.StationId,
        x.Station.Name,
        x.Station.StationCode,
        x.AlarmTypeId,
        x.AlarmType.Code,
        x.Severity,
        x.Status,
        new DateTimeOffset(DateTime.SpecifyKind(x.RaisedAtUtc, DateTimeKind.Utc)),
        x.AcknowledgedAtUtc.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(x.AcknowledgedAtUtc.Value, DateTimeKind.Utc)) : null,
        x.AcknowledgedByUser == null ? null : x.AcknowledgedByUser.Email,
        x.ResolvedAtUtc.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(x.ResolvedAtUtc.Value, DateTimeKind.Utc)) : null,
        x.ResolvedByUser == null ? null : x.ResolvedByUser.Email,
        x.Message,
        x.ResolutionNote,
        x.ValueAtRaise,
        x.ThresholdValue);
}
