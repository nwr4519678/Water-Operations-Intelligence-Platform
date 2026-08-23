using System.Text.Json;
using Hangfire;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class NotificationDeliveryJob(WaterOperationsDbContext db, IHubContext<TelemetryHub, ITelemetryClient> hub)
{
    [AutomaticRetry(Attempts = 5)]
    public async Task PublishPendingAsync(CancellationToken cancellationToken = default)
    {
        var pending = await db.Notifications.Where(x => x.SentAtUtc == null).OrderBy(x => x.CreatedAtUtc).Take(100).ToListAsync(cancellationToken);
        foreach (var notification in pending)
        {
            var payload = JsonSerializer.SerializeToElement(new { notification.NotificationId, notification.UserId, notification.Title, notification.Body, notification.Severity, notification.Channel });
            await hub.Clients.Group($"org:{notification.OrganizationId}").NotificationCreated(new RealtimeEventEnvelope("1", "NotificationCreated", notification.CreatedAtUtc, payload));
            notification.SentAtUtc = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
