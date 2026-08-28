namespace WaterOperations.Application.Features.Reports.DTOs;

/// <summary>
/// Generated report metadata and status.
/// </summary>
public sealed record ReportDto(
    Guid ReportId,
    Guid? StationId,
    string Format,
    string Status,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc,
    DateTime CreatedAtUtc,
    string? FilePath);

/// <summary>
/// Downloadable report artifact details.
/// </summary>
public sealed record ReportDownloadDto(
    Guid ReportId,
    string Format,
    string FilePath,
    string ContentType);

/// <summary>
/// Scheduled recurring report metadata.
/// </summary>
public sealed record ReportScheduleDto(
    long ScheduleId,
    string Frequency,
    string Format,
    string RecipientJson,
    DateTime NextRunAtUtc,
    DateTime? LastRunAtUtc,
    bool IsActive);

/// <summary>
/// Request contract for initiating report generation.
/// </summary>
public sealed record CreateReportRequest(
    Guid? StationId,
    int? ParameterId,
    string Format,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc);

/// <summary>
/// Query filter options for retrieving generated reports.
/// </summary>
public sealed record ReportFilter(
    Guid? StationId,
    string? Status);
