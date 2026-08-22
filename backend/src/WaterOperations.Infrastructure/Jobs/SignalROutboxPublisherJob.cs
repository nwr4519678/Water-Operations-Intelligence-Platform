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
                    var envelope = new RealtimeEventEnvelope("1", message.EventType, message.OccurredAtUtc, payload);
                    var clients = hub.Clients.Group($"org:{message.OrganizationId.Value}");
                    await (message.EventType switch
                    {
                        "StationStatusChanged" => clients.StationStatusChanged(envelope),
                        "AlarmTriggered" => clients.AlarmTriggered(envelope),
                        "AlarmAcknowledged" => clients.AlarmAcknowledged(envelope),
                        "AlarmResolved" => clients.AlarmResolved(envelope),
                        "AnomalyDetected" => clients.AnomalyDetected(envelope),
                        "ModelPromoted" => clients.ModelPromoted(envelope),
                        "DataQualityChanged" => clients.DataQualityChanged(envelope),
                        "AiAvailabilityChanged" => clients.AiAvailabilityChanged(envelope),
                        "NotificationCreated" => clients.NotificationCreated(envelope),
                        "NotificationDigestCreated" => clients.NotificationDigestCreated(envelope),
                        _ => clients.MeasurementUpdated(envelope)
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
