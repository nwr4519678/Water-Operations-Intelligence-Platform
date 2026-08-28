using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Reports.DTOs;
using WaterOperations.Application.Features.Reports.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Reports.Repositories;

public sealed class ReportRepository(WaterOperationsDbContext db) : IReportRepository
{
    public async Task<PagedResult<ReportDto>> GetReportsAsync(
        Guid organizationId,
        Guid userId,
        ReportFilter filter,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.Reports
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (filter.StationId.HasValue)
        {
            query = query.Where(x => x.StationId == filter.StationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var statusFilter = filter.Status;
            query = query.Where(x => string.Equals(x.Status, statusFilter, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ReportDto(
                x.ReportId,
                x.StationId,
                x.Format,
                x.Status,
                x.PeriodStartUtc,
                x.PeriodEndUtc,
                x.CreatedAtUtc,
                x.FilePath))
            .ToListAsync(cancellationToken);

        return new PagedResult<ReportDto>(items, total, page, pageSize);
    }

    public async Task<ReportDto> CreateReportAsync(
        Guid organizationId,
        Guid userId,
        CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        var report = new Report
        {
            OrganizationId = organizationId,
            RequestedByUserId = userId,
            StationId = request.StationId,
            ParameterId = request.ParameterId,
            Format = request.Format.ToUpperInvariant(),
            Status = "PENDING",
            PeriodStartUtc = request.PeriodStartUtc,
            PeriodEndUtc = request.PeriodEndUtc,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Reports.Add(report);
        await db.SaveChangesAsync(cancellationToken);

        return new ReportDto(
            report.ReportId,
            report.StationId,
            report.Format,
            report.Status,
            report.PeriodStartUtc,
            report.PeriodEndUtc,
            report.CreatedAtUtc,
            report.FilePath);
    }

    public async Task<ReportDto?> GetReportAsync(
        Guid organizationId,
        Guid userId,
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var report = await db.Reports
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ReportId == reportId, cancellationToken);

        return report is null
            ? null
            : new ReportDto(
                report.ReportId,
                report.StationId,
                report.Format,
                report.Status,
                report.PeriodStartUtc,
                report.PeriodEndUtc,
                report.CreatedAtUtc,
                report.FilePath);
    }

    public async Task<ReportScheduleDto> CreateReportScheduleAsync(
        Guid organizationId,
        Guid userId,
        string frequency,
        string format,
        string recipientJson,
        DateTime nextRunAtUtc,
        CancellationToken cancellationToken)
    {
        var schedule = new ReportSchedule
        {
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            Frequency = frequency.ToUpperInvariant(),
            Format = format.ToUpperInvariant(),
            RecipientJson = recipientJson,
            NextRunAtUtc = nextRunAtUtc,
            IsActive = true
        };

        db.ReportSchedules.Add(schedule);
        await db.SaveChangesAsync(cancellationToken);

        return new ReportScheduleDto(
            schedule.ReportScheduleId,
            schedule.Frequency,
            schedule.Format,
            schedule.RecipientJson,
            schedule.NextRunAtUtc,
            schedule.LastRunAtUtc,
            schedule.IsActive);
    }

    public async Task<bool> SetReportScheduleActiveAsync(
        Guid organizationId,
        Guid userId,
        long scheduleId,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var schedule = await db.ReportSchedules
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ReportScheduleId == scheduleId, cancellationToken);

        if (schedule is null)
        {
            return false;
        }

        schedule.IsActive = isActive;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
