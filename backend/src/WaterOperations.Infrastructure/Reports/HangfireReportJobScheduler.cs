using Hangfire;
using WaterOperations.Application.Features.Reports.Interfaces;

namespace WaterOperations.Infrastructure.Reports;

public sealed class HangfireReportJobScheduler(IBackgroundJobClient backgroundJobs) : IReportJobScheduler
{
    public void Schedule(Guid reportId) =>
        backgroundJobs.Enqueue<ReportGenerationJob>(job => job.GenerateAsync(reportId, CancellationToken.None));

    public void ScheduleRecurring(long scheduleId, string frequency)
    {
        var cron = frequency.ToUpperInvariant() switch
        {
            "WEEKLY" => Cron.Weekly(DayOfWeek.Monday),
            "MONTHLY" => Cron.Monthly(1),
            _ => Cron.Daily()
        };

        RecurringJob.AddOrUpdate<ReportScheduleJob>(
            $"report-schedule:{scheduleId}",
            job => job.RunAsync(scheduleId, CancellationToken.None),
            cron,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
}
