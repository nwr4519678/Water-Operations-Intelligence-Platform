using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

namespace WaterOperations.Application.Features.ProductCapabilities.Queries;

public sealed record GetReportQuery(Guid ReportId) : IQuery<ScopeResult<ReportDto>>, IRequireOrganization, IRequireUser;
public sealed record DownloadReportQuery(Guid ReportId) : IQuery<ScopeResult<ReportDownloadDto>>, IRequireOrganization, IRequireUser;

public sealed class GetReportQueryHandler(IReportRepository repository, ICurrentUser currentUser) : IQueryHandler<GetReportQuery, ScopeResult<ReportDto>>
{
    public async Task<ScopeResult<ReportDto>> Handle(GetReportQuery request, CancellationToken cancellationToken) =>
        (await repository.GetReportAsync(currentUser.OrganizationId!.Value, currentUser.UserId!.Value, request.ReportId, cancellationToken)) is { } report
            ? ScopeResult.Authorized(report)
            : ScopeResult.NotFound<ReportDto>();

public sealed class DownloadReportQueryHandler(IReportRepository repository, IFileStorage fileStorage, ICurrentUser currentUser) : IQueryHandler<DownloadReportQuery, ScopeResult<ReportDownloadDto>>
{
    public async Task<ScopeResult<ReportDownloadDto>> Handle(DownloadReportQuery request, CancellationToken cancellationToken)
    {
        var report = await repository.GetReportAsync(currentUser.OrganizationId!.Value, currentUser.UserId!.Value, request.ReportId, cancellationToken);
        if (report is null || !string.Equals(report.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(report.FilePath)) return ScopeResult.NotFound<ReportDownloadDto>();
        var content = await fileStorage.OpenReadAsync(report.FilePath, cancellationToken);
        return content is null
            ? ScopeResult.NotFound<ReportDownloadDto>()
            : ScopeResult.Authorized(new ReportDownloadDto(content, report.Format.ToUpperInvariant() switch { "PDF" => "application/pdf", "XLSX" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", _ => "text/csv" }, $"report-{report.ReportId:N}.{report.Format.ToLowerInvariant()}"));
    }
}
}
