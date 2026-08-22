using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface IProductCapabilityRepository
{
    Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<ModelDto>> GetModelsAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<ReportDto>> GetReportsAsync(Guid organizationId, Guid userId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid organizationId, Guid userId, bool unreadOnly, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<int> GetUnreadNotificationCountAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> MarkNotificationReadAsync(Guid organizationId, Guid userId, long notificationId, CancellationToken cancellationToken);
    Task<PagedResult<AuditEntryDto>> GetAuditAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<UserAdminDto>> GetUsersAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<OrganizationDto?> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> SaveLayoutAsync(Guid userId, string name, string widgetsJson, bool isDefault, CancellationToken cancellationToken);
    Task<PagedResult<SearchResultDto>> SearchAsync(Guid organizationId, string query, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<PagedResult<CollaborationNoteDto>> GetNotesAsync(Guid organizationId, Guid stationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<CollaborationNoteDto> AddNoteAsync(Guid organizationId, Guid userId, Guid stationId, string noteText, CancellationToken cancellationToken);
    Task<SharedSnapshotDto> CreateSnapshotAsync(Guid organizationId, Guid userId, Guid? stationId, string snapshotJson, int expiresInHours, CancellationToken cancellationToken);
    Task<ReportScheduleDto> CreateReportScheduleAsync(Guid organizationId, Guid userId, string frequency, string format, string recipientJson, DateTime nextRunAtUtc, CancellationToken cancellationToken);
    Task<bool> UpdateOrganizationAsync(Guid organizationId, string name, string? logoUrl, string locale, string timeZone, CancellationToken cancellationToken);
    Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken cancellationToken);
    Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken cancellationToken);
    Task<IReadOnlyList<NotificationPreferenceDto>> GetNotificationPreferencesAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> SaveNotificationPreferenceAsync(Guid userId, NotificationPreferenceDto preference, CancellationToken cancellationToken);
    Task<ReportDto> CreateReportAsync(Guid organizationId, Guid userId, CreateReportRequest request, CancellationToken cancellationToken);
    Task<ReportDto?> GetReportAsync(Guid organizationId, Guid userId, Guid reportId, CancellationToken cancellationToken);
    Task<ModelMutationResult> PromoteModelAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ModelMutationResult> StartModelRetrainingAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken);
}
