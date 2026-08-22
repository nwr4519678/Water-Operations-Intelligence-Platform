using Hangfire;
using WaterOperations.Application.Features.ProductCapabilities.Reports;

namespace WaterOperations.Infrastructure.ProductCapabilities.Reports;

public sealed class HangfireReportJobScheduler(IBackgroundJobClient backgroundJobs) : IReportJobScheduler
{
    public void Schedule(Guid reportId) => backgroundJobs.Enqueue<ReportGenerationJob>(job => job.GenerateAsync(reportId, CancellationToken.None));
}
