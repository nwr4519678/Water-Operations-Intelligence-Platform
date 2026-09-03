using WaterOperations.Application.Features.Reports.DTOs;

namespace WaterOperations.Application.Features.Reports.Interfaces;

/// <summary>
/// Builds a downloadable report document (PDF or CSV) from real DaHITI
/// telemetry observations.  Lives in Application so the handler can depend
/// on it without touching Infrastructure.
/// </summary>
public interface IReportDocumentBuilder
{
    /// <summary>
    /// Generates the binary document and returns the ready-to-stream DTO.
    /// </summary>
    Task<ReportDownloadDto> BuildAsync(
        ReportDto report,
        CancellationToken cancellationToken);
}
