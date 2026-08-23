using Hangfire;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Reports;

public sealed class ReportScheduleJob(WaterOperationsDbContext db, IBackgroundJobClient backgroundJobs)
{
    [DisableConcurrentExecution(300)]
    public async Task RunAsync(long scheduleId, CancellationToken cancellationToken)
    {
        var schedule = await db.ReportSchedules.SingleOrDefaultAsync(x => x.ReportScheduleId == scheduleId && x.IsActive, cancellationToken);
        if (schedule is null) return;

        var now = DateTime.UtcNow;
        if (schedule.NextRunAtUtc > now) return;
        var periodEnd = schedule.NextRunAtUtc;
        var periodStart = schedule.Frequency switch
        {
            "WEEKLY" => periodEnd.AddDays(-7),
            "MONTHLY" => periodEnd.AddMonths(-1),
            _ => periodEnd.AddDays(-1)
        };
        var alreadyCreated = await db.Reports.AnyAsync(x => x.OrganizationId == schedule.OrganizationId && x.RequestedByUserId == schedule.CreatedByUserId && x.CreatedAtUtc >= periodEnd.AddMinutes(-1) && x.CreatedAtUtc < periodEnd.AddMinutes(1), cancellationToken);
        if (!alreadyCreated)
        {
            var report = new Report
            {
                ReportId = Guid.NewGuid(), OrganizationId = schedule.OrganizationId, RequestedByUserId = schedule.CreatedByUserId,
                StationId = schedule.StationId, ParameterId = schedule.ParameterId, PeriodStartUtc = periodStart, PeriodEndUtc = periodEnd,
                Format = schedule.Format, Status = "QUEUED", CreatedAtUtc = now
            };
            db.Reports.Add(report);
            schedule.LastRunAtUtc = now;
            schedule.NextRunAtUtc = schedule.Frequency switch
            {
                "WEEKLY" => periodEnd.AddDays(7),
                "MONTHLY" => periodEnd.AddMonths(1),
                _ => periodEnd.AddDays(1)
            };
            db.AuditLogs.Add(new AuditLog { OrganizationId = schedule.OrganizationId, ActorUserId = schedule.CreatedByUserId, ActionCode = "REPORT_SCHEDULE_EXECUTED", EntityType = "ReportSchedule", EntityId = scheduleId.ToString(CultureInfo.InvariantCulture), Success = true, OccurredAtUtc = now });
            await db.SaveChangesAsync(cancellationToken);
            backgroundJobs.Enqueue<ReportGenerationJob>(job => job.GenerateAsync(report.ReportId, CancellationToken.None));
        }
    }
}
