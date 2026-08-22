using System.Text.Json;
using Hangfire;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class NotificationDigestJob(WaterOperationsDbContext db, IHubContext<TelemetryHub, ITelemetryClient> hub)
{
    [DisableConcurrentExecution(300)]
    public async Task PublishDailyDigestsAsync(CancellationToken cancellationToken = default)
    {
        var since = DateTime.UtcNow.Date.AddDays(-1);
        var users = await db.NotificationPreferences.AsNoTracking().Where(x => x.DailyDigestEnabled).Select(x => new { x.UserId, x.User.OrganizationId }).Distinct().ToListAsync(cancellationToken);
        foreach (var user in users)
        {
            var alreadySent = await db.AuditLogs.AnyAsync(x => x.OrganizationId == user.OrganizationId && x.ActorUserId == user.UserId && x.ActionCode == "NOTIFICATION_DIGEST_SENT" && x.OccurredAtUtc >= since, cancellationToken);
            if (alreadySent) continue;
            var count = await db.Notifications.CountAsync(x => x.OrganizationId == user.OrganizationId && x.UserId == user.UserId && x.CreatedAtUtc >= since, cancellationToken);
            if (count == 0) continue;
            var payload = JsonSerializer.SerializeToElement(new { user.UserId, Count = count, FromUtc = since, ToUtc = DateTime.UtcNow });
            await hub.Clients.Group($"org:{user.OrganizationId}").NotificationDigestCreated(new RealtimeEventEnvelope("1", "NotificationDigestCreated", DateTime.UtcNow, payload));
            db.AuditLogs.Add(new Domain.Entities.AuditLog { OrganizationId = user.OrganizationId, ActorUserId = user.UserId, ActionCode = "NOTIFICATION_DIGEST_SENT", EntityType = "Notification", Success = true, OccurredAtUtc = DateTime.UtcNow });
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
