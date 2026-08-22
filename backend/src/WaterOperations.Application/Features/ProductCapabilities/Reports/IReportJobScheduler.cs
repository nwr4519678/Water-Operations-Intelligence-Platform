namespace WaterOperations.Application.Features.ProductCapabilities.Reports;

public interface IReportJobScheduler
{
    void Schedule(Guid reportId);
}
