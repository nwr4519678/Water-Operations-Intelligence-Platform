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
}
