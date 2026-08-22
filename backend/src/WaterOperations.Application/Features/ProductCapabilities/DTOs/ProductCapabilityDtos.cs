using WaterOperations.Application.Common.Pagination;

namespace WaterOperations.Application.Features.ProductCapabilities.DTOs;

public sealed record AnomalyDto(long Id, Guid StationId, string ReasonCode, decimal Score, DateTime DetectedAtUtc, bool IsReviewed);
public sealed record ModelDto(Guid ModelId, string ModelType, string Version, string Status, DateTime? PromotedAtUtc);
public sealed record ReportDto(Guid ReportId, Guid? StationId, string Format, string Status, DateTime PeriodStartUtc, DateTime PeriodEndUtc, DateTime CreatedAtUtc, string? FilePath);
public sealed record NotificationDto(long Id, string Title, string Body, string Severity, string Channel, bool IsRead, DateTime CreatedAtUtc);
public sealed record AuditEntryDto(long Id, string ActionCode, string? EntityType, string? EntityId, bool Success, DateTime OccurredAtUtc, Guid? ActorUserId);
public sealed record UserAdminDto(Guid UserId, string Email, string DisplayName, string ClientType, bool IsActive, DateTime CreatedAtUtc);
public sealed record OrganizationDto(Guid OrganizationId, string Name, string Slug, string? LogoUrl, string DefaultLocale, string DefaultTimeZone, bool IsActive);
public sealed record DashboardLayoutDto(long Id, string LayoutName, string WidgetsJson, bool IsDefault, DateTime UpdatedAtUtc);
public sealed record SearchResultDto(string Type, string Id, string Title, string? Subtitle);
public sealed record CollaborationNoteDto(long NoteId, Guid StationId, Guid AuthorUserId, string NoteText, bool IsResolved, DateTime CreatedAtUtc, DateTime UpdatedAtUtc);
public sealed record SharedSnapshotDto(Guid ShareSnapshotId, Guid? StationId, DateTime ExpiresAtUtc, DateTime CreatedAtUtc);
public sealed record AddCollaborationNoteRequest(string NoteText);
public sealed record ReportScheduleDto(long Id, string Frequency, string Format, string RecipientJson, DateTime NextRunAtUtc, DateTime? LastRunAtUtc, bool IsActive);
public sealed record CreateReportRequest(Guid? StationId, int? ParameterId, DateTime PeriodStartUtc, DateTime PeriodEndUtc, string Format);
public sealed record SetUserActiveRequest(bool IsActive);
public sealed record UserPreferencesDto(string Theme, string Locale, string TimeZone, byte DecimalPrecision);
public sealed record NotificationPreferenceDto(string Severity, bool InAppEnabled, bool EmailEnabled, bool PushEnabled, bool DesktopEnabled, bool DailyDigestEnabled);
public sealed record ModelMutationResult(bool Succeeded, string? ErrorCode);
public sealed record AiResourceRequest(Guid ResourceId);
public sealed record ProductPage<T>(PagedResult<T> Result);
