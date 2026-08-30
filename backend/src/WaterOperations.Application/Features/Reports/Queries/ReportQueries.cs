using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Reports.DTOs;
using WaterOperations.Application.Features.Reports.Interfaces;

namespace WaterOperations.Application.Features.Reports.Queries;

public sealed record GetReportsQuery(
    ReportFilter Filter,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ReportDto>>>, IRequireOrganization, IRequireUser;

public sealed record GetReportQuery(
    Guid ReportId) : IQuery<ScopeResult<ReportDto>>, IRequireOrganization, IRequireUser;

public sealed record DownloadReportQuery(
    Guid ReportId) : IQuery<ScopeResult<ReportDownloadDto>>, IRequireOrganization, IRequireUser;

public sealed class GetReportsQueryHandler(
    IReportRepository repository,
    ICurrentUser user) : IQueryHandler<GetReportsQuery, ScopeResult<PagedResult<ReportDto>>>
{
    public async Task<ScopeResult<PagedResult<ReportDto>>> Handle(
        GetReportsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetReportsAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Filter,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetReportQueryHandler(
    IReportRepository repository,
    ICurrentUser user) : IQueryHandler<GetReportQuery, ScopeResult<ReportDto>>
{
    public async Task<ScopeResult<ReportDto>> Handle(
        GetReportQuery request,
        CancellationToken cancellationToken)
    {
        var report = await repository.GetReportAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.ReportId,
            cancellationToken);

        return report is null
            ? ScopeResult.NotFound<ReportDto>()
            : ScopeResult.Authorized(report);
    }
}

public sealed class DownloadReportQueryHandler(
    IReportRepository repository,
    ICurrentUser user) : IQueryHandler<DownloadReportQuery, ScopeResult<ReportDownloadDto>>
{
    public async Task<ScopeResult<ReportDownloadDto>> Handle(
        DownloadReportQuery request,
        CancellationToken cancellationToken)
    {
        var report = await repository.GetReportAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.ReportId,
            cancellationToken);

        if (report is null || report.Status != "COMPLETED" || string.IsNullOrWhiteSpace(report.FilePath))
        {
            return ScopeResult.NotFound<ReportDownloadDto>();
        }

        var download = new ReportDownloadDto(
            report.ReportId,
            report.Format,
            report.FilePath,
            report.Format.ToUpperInvariant() switch
            {
                "PDF" => "application/pdf",
                "EXCEL" or "XLSX" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "text/csv"
            });

        return ScopeResult.Authorized(download);
    }
}
