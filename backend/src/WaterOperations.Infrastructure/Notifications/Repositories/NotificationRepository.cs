using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Application.Features.Notifications.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Notifications.Repositories;

public sealed class NotificationRepository(WaterOperationsDbContext db) : INotificationRepository
{
    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(
        Guid organizationId,
        Guid userId,
        bool unreadOnly,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.Notifications
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(x => x.ReadAtUtc == null);
        }

        query = query.OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new NotificationDto(
                x.NotificationId,
                x.Title,
                x.Body,
                x.Severity,
                x.Channel,
                x.ReadAtUtc != null,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationDto>(items, total, page, pageSize);
    }

    public async Task<int> GetUnreadNotificationCountAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await db.Notifications
            .Where(x => x.OrganizationId == organizationId && x.UserId == userId && x.ReadAtUtc == null)
            .CountAsync(cancellationToken);
    }

    public async Task<bool> MarkNotificationReadAsync(
        Guid organizationId,
        Guid userId,
        long notificationId,
        CancellationToken cancellationToken)
    {
        var item = await db.Notifications
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId && x.NotificationId == notificationId, cancellationToken);

        if (item is null)
        {
            return false;
        }

        item.ReadAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<NotificationPreferenceDto>> GetNotificationPreferencesAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await db.NotificationPreferences
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new NotificationPreferenceDto(
                x.Severity,
                x.InAppEnabled,
                x.EmailEnabled,
                x.PushEnabled,
                x.DesktopEnabled,
                x.DailyDigestEnabled))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SaveNotificationPreferenceAsync(
        Guid organizationId,
        Guid userId,
        NotificationPreferenceDto preference,
        CancellationToken cancellationToken)
    {
        var existing = await db.NotificationPreferences
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Severity == preference.Severity, cancellationToken);

        if (existing is null)
        {
            db.NotificationPreferences.Add(new NotificationPreference
            {
                UserId = userId,
                Severity = preference.Severity,
                InAppEnabled = preference.InAppEnabled,
                EmailEnabled = preference.EmailEnabled,
                PushEnabled = preference.PushEnabled,
                DesktopEnabled = preference.DesktopEnabled,
                DailyDigestEnabled = preference.DailyDigestEnabled
            });
        }
        else
        {
            existing.InAppEnabled = preference.InAppEnabled;
            existing.EmailEnabled = preference.EmailEnabled;
            existing.PushEnabled = preference.PushEnabled;
            existing.DesktopEnabled = preference.DesktopEnabled;
            existing.DailyDigestEnabled = preference.DailyDigestEnabled;
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
