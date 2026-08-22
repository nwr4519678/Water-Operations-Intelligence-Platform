using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.ProductCapabilities.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Notifications;

public sealed class EfNotificationRepository(WaterOperationsDbContext db) : EfProductCapabilityRepositoryBase(db), INotificationRepository
{
    public Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid organizationId, Guid userId, bool unreadOnly, PaginationRequest pagination, CancellationToken cancellationToken)
    {
        var query = Db.Notifications.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.UserId == userId);
        if (unreadOnly) query = query.Where(x => x.ReadAtUtc == null);
        return PageAsync(query.OrderByDescending(x => x.CreatedAtUtc).Select(x => new NotificationDto(x.NotificationId, x.Title, x.Body, x.Severity, x.Channel, x.ReadAtUtc != null, x.CreatedAtUtc)), pagination, cancellationToken);
    }

    public Task<int> GetUnreadNotificationCountAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) => Db.Notifications.CountAsync(x => x.OrganizationId == organizationId && x.UserId == userId && x.ReadAtUtc == null, cancellationToken);

    public async Task<bool> MarkNotificationReadAsync(Guid organizationId, Guid userId, long notificationId, CancellationToken cancellationToken)
    {
        var notification = await Db.Notifications.SingleOrDefaultAsync(x => x.NotificationId == notificationId && x.OrganizationId == organizationId && x.UserId == userId, cancellationToken);
        if (notification is null) return false;
        notification.ReadAtUtc ??= DateTime.UtcNow;
        await Db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<NotificationPreferenceDto>> GetNotificationPreferencesAsync(Guid userId, CancellationToken cancellationToken) => await Db.NotificationPreferences.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.Severity).Select(x => new NotificationPreferenceDto(x.Severity, x.InAppEnabled, x.EmailEnabled, x.PushEnabled, x.DesktopEnabled, x.DailyDigestEnabled)).ToListAsync(cancellationToken);

    public async Task<bool> SaveNotificationPreferenceAsync(Guid organizationId, Guid userId, NotificationPreferenceDto preference, CancellationToken cancellationToken)
    {
        var entity = await Db.NotificationPreferences.SingleOrDefaultAsync(x => x.UserId == userId && x.Severity == preference.Severity, cancellationToken);
        if (entity is null) Db.NotificationPreferences.Add(new NotificationPreference { UserId = userId, Severity = preference.Severity, InAppEnabled = preference.InAppEnabled, EmailEnabled = preference.EmailEnabled, PushEnabled = preference.PushEnabled, DesktopEnabled = preference.DesktopEnabled, DailyDigestEnabled = preference.DailyDigestEnabled });
        else { entity.InAppEnabled = preference.InAppEnabled; entity.EmailEnabled = preference.EmailEnabled; entity.PushEnabled = preference.PushEnabled; entity.DesktopEnabled = preference.DesktopEnabled; entity.DailyDigestEnabled = preference.DailyDigestEnabled; }
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "NOTIFICATION_PREFERENCE_UPDATED", EntityType = "NotificationPreference", EntityId = preference.Severity, Success = true, OccurredAtUtc = DateTime.UtcNow, AfterJson = JsonSerializer.Serialize(preference) });
        await Db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
