using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class SignalROutboxPublisherJob(
    WaterOperationsDbContext db,
    IHubContext<TelemetryHub, ITelemetryClient> hub)
{
    public async Task PublishAsync(CancellationToken cancellationToken = default)
    {
        var messages = await db.OutboxMessages
            .Where(x => x.ProcessedAtUtc == null && x.AttemptCount < 10)
            .OrderBy(x => x.OccurredAtUtc)
            .Take(100)
            .ToListAsync(cancellationToken);
        foreach (var message in messages)
        {
            try
            {
                var payload = JsonSerializer.Deserialize<JsonElement>(message.PayloadJson);
                if (message.OrganizationId.HasValue)
                {
                    await hub.Clients
                        .Group($"org:{message.OrganizationId.Value}")
                        .MeasurementUpdated(
                            new
                            {
                                protocolVersion = "1",
                                eventType = message.EventType,
                                occurredAtUtc = message.OccurredAtUtc,
                                payload
                            });
                }

                message.AttemptCount++;
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.LastError = string.Empty;
            }
            catch (Exception exception)
            {
                message.AttemptCount++;
                message.FailedAtUtc = DateTime.UtcNow;
                message.LastError = exception.Message[..Math.Min(exception.Message.Length, 4000)];
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
