namespace WaterOperations.Application.Features.Reports.Interfaces;

/// <summary>
/// Interface for scheduling background report generation jobs.
/// </summary>
public interface IReportJobScheduler
{
    void Schedule(Guid reportId);
    void ScheduleRecurring(long scheduleId, string frequency);
}
