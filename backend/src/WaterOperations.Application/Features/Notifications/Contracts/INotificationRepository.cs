using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.Notifications.Contracts;

public interface INotificationRepository
{
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid organizationId, Guid userId, bool unreadOnly, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<int> GetUnreadNotificationCountAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> MarkNotificationReadAsync(Guid organizationId, Guid userId, long notificationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<NotificationPreferenceDto>> GetNotificationPreferencesAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> SaveNotificationPreferenceAsync(Guid organizationId, Guid userId, NotificationPreferenceDto preference, CancellationToken cancellationToken);
}
