using WaterOperations.Application.Features.Reports.Interfaces;

namespace WaterOperations.Infrastructure.Reports;

public sealed class NoOpReportJobScheduler : IReportJobScheduler
{
    public void Schedule(Guid reportId) { }
    public void ScheduleRecurring(long scheduleId, string frequency) { }
}
