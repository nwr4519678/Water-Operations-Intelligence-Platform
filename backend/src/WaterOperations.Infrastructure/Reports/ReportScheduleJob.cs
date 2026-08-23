using Hangfire;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Reports;

public sealed class ReportScheduleJob(WaterOperationsDbContext db, IBackgroundJobClient backgroundJobs)
{
    public async Task RunAsync(long scheduleId, CancellationToken cancellationToken)
    {
        var schedule = await db.ReportSchedules
            .FirstOrDefaultAsync(x => x.ReportScheduleId == scheduleId && x.IsActive, cancellationToken);

        if (schedule is null)
        {
            return;
        }

        var report = new Report
        {
            OrganizationId = schedule.OrganizationId,
            RequestedByUserId = schedule.CreatedByUserId,
            Format = schedule.Format,
            Status = "PENDING",
            PeriodStartUtc = DateTime.UtcNow.AddDays(-7),
            PeriodEndUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Reports.Add(report);
        schedule.LastRunAtUtc = DateTime.UtcNow;
        schedule.NextRunAtUtc = schedule.Frequency switch
        {
            "WEEKLY" => DateTime.UtcNow.AddDays(7),
            "MONTHLY" => DateTime.UtcNow.AddMonths(1),
            _ => DateTime.UtcNow.AddDays(1)
        };

        await db.SaveChangesAsync(cancellationToken);
        backgroundJobs.Enqueue<ReportGenerationJob>(job => job.GenerateAsync(report.ReportId, CancellationToken.None));
    }
}
