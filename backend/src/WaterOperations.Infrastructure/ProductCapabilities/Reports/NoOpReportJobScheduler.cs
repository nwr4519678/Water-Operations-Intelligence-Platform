using WaterOperations.Application.Features.ProductCapabilities.Reports;

namespace WaterOperations.Infrastructure.ProductCapabilities.Reports;

public sealed class NoOpReportJobScheduler : IReportJobScheduler
{
    public void Schedule(Guid reportId) { }
    public void ScheduleRecurring(long scheduleId, string frequency) { }
}
