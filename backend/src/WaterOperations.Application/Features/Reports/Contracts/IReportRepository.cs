using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface IReportRepository
{
    Task<PagedResult<ReportDto>> GetReportsAsync(Guid organizationId, Guid userId, ReportFilter filter, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<ReportDto> CreateReportAsync(Guid organizationId, Guid userId, CreateReportRequest request, CancellationToken cancellationToken);
    Task<ReportDto?> GetReportAsync(Guid organizationId, Guid userId, Guid reportId, CancellationToken cancellationToken);
    Task<ReportScheduleDto> CreateReportScheduleAsync(Guid organizationId, Guid userId, string frequency, string format, string recipientJson, DateTime nextRunAtUtc, CancellationToken cancellationToken);
    Task<bool> SetReportScheduleActiveAsync(Guid organizationId, Guid userId, long scheduleId, bool isActive, CancellationToken cancellationToken);
}
