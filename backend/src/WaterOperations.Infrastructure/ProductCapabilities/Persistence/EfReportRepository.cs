using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Persistence;

public sealed class EfReportRepository(WaterOperationsDbContext db) : EfProductCapabilityRepositoryBase(db), IReportRepository
{
    public Task<PagedResult<ReportDto>> GetReportsAsync(Guid organizationId, Guid userId, ReportFilter filter, PaginationRequest pagination, CancellationToken cancellationToken)
    {
        var query = Db.Reports.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.RequestedByUserId == userId);
        if (filter.StationId is not null) query = query.Where(x => x.StationId == filter.StationId.Value);
        if (filter.ParameterId is not null) query = query.Where(x => x.ParameterId == filter.ParameterId.Value);
        if (filter.FromUtc is not null) query = query.Where(x => x.PeriodStartUtc >= filter.FromUtc.Value);
        if (filter.ToUtc is not null) query = query.Where(x => x.PeriodEndUtc <= filter.ToUtc.Value);
        if (!string.IsNullOrWhiteSpace(filter.Status)) query = query.Where(x => x.Status == filter.Status);
        return PageAsync(query.OrderByDescending(x => x.CreatedAtUtc).Select(x => new ReportDto(x.ReportId, x.StationId, x.Format, x.Status, x.PeriodStartUtc, x.PeriodEndUtc, x.CreatedAtUtc, x.FilePath)), pagination, cancellationToken);
    }

    public async Task<ReportDto> CreateReportAsync(Guid organizationId, Guid userId, CreateReportRequest request, CancellationToken cancellationToken)
    {
        var report = new Report { ReportId = Guid.NewGuid(), OrganizationId = organizationId, RequestedByUserId = userId, StationId = request.StationId, ParameterId = request.ParameterId, PeriodStartUtc = DateTime.SpecifyKind(request.PeriodStartUtc, DateTimeKind.Utc), PeriodEndUtc = DateTime.SpecifyKind(request.PeriodEndUtc, DateTimeKind.Utc), Format = request.Format.ToUpperInvariant(), Status = "QUEUED", CreatedAtUtc = DateTime.UtcNow };
        Db.Reports.Add(report);
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "REPORT_CREATED", EntityType = "Report", EntityId = report.ReportId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow });
        await Db.SaveChangesAsync(cancellationToken);
        return new ReportDto(report.ReportId, report.StationId, report.Format, report.Status, report.PeriodStartUtc, report.PeriodEndUtc, report.CreatedAtUtc, report.FilePath);
    }

    public Task<ReportDto?> GetReportAsync(Guid organizationId, Guid userId, Guid reportId, CancellationToken cancellationToken) => Db.Reports.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.RequestedByUserId == userId && x.ReportId == reportId).Select(x => new ReportDto(x.ReportId, x.StationId, x.Format, x.Status, x.PeriodStartUtc, x.PeriodEndUtc, x.CreatedAtUtc, x.FilePath)).SingleOrDefaultAsync(cancellationToken);

    public async Task<ReportScheduleDto> CreateReportScheduleAsync(Guid organizationId, Guid userId, string frequency, string format, string recipientJson, DateTime nextRunAtUtc, CancellationToken cancellationToken)
    {
        var schedule = new ReportSchedule { OrganizationId = organizationId, CreatedByUserId = userId, Frequency = frequency, Format = format, RecipientJson = recipientJson, NextRunAtUtc = DateTime.SpecifyKind(nextRunAtUtc, DateTimeKind.Utc), IsActive = true };
        Db.ReportSchedules.Add(schedule);
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "REPORT_SCHEDULE_CREATED", EntityType = "ReportSchedule", EntityId = schedule.ReportScheduleId.ToString(CultureInfo.InvariantCulture), Success = true, OccurredAtUtc = DateTime.UtcNow });
        await Db.SaveChangesAsync(cancellationToken);
        return new ReportScheduleDto(schedule.ReportScheduleId, schedule.Frequency, schedule.Format, schedule.RecipientJson, schedule.NextRunAtUtc, schedule.LastRunAtUtc, schedule.IsActive);
    }
}
