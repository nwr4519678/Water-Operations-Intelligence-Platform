using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using WaterOperations.Application.Common.Contracts;

namespace WaterOperations.Api.Hubs;

public sealed class IntegrationEventSubscriber(
    IConnectionMultiplexer redis,
    IHubContext<TelemetryHub, ITelemetryClient> hub,
    ILogger<IntegrationEventSubscriber> logger) : BackgroundService
{
    private const string Channel = "water-operations:integration-events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var subscriber = redis.GetSubscriber();
        await subscriber.SubscribeAsync(RedisChannel.Literal(Channel), (redisChannel, value) =>
        {
            _ = DispatchAsync(value.ToString(), stoppingToken);
        });

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
        finally
        {
            await subscriber.UnsubscribeAsync(RedisChannel.Literal(Channel));
        }
    }

    private async Task DispatchAsync(string serializedEnvelope, CancellationToken cancellationToken)
    {
        try
        {
            using var envelope = JsonDocument.Parse(serializedEnvelope);
            var root = envelope.RootElement;
            if (!root.TryGetProperty("OrganizationId", out var organization) ||
                !root.TryGetProperty("PayloadJson", out var payloadText) ||
                string.IsNullOrWhiteSpace(payloadText.GetString()))
            {
                logger.LogWarning("Ignoring integration event without organization, region, or payload: {Event}", serializedEnvelope);
                return;
            }

            var payloadJson = payloadText.GetString()!;
            using var payloadDocument = JsonDocument.Parse(payloadJson);
            if (!payloadDocument.RootElement.TryGetProperty("RegionId", out var region))
            {
                logger.LogWarning("Ignoring integration event without a region: {Event}", serializedEnvelope);
                return;
            }
            var group = $"telemetry:{organization.GetString()}:{region.GetString()}";
            var payload = payloadDocument.RootElement;
            var eventType = root.GetProperty("EventType").GetString();
            switch (eventType)
            {
                case nameof(MeasurementUpdatedEvent): await hub.Clients.Group(group).MeasurementUpdated(payload.Deserialize<MeasurementUpdatedEvent>()!); break;
                case nameof(StationStatusChangedEvent): await hub.Clients.Group(group).StationStatusChanged(payload.Deserialize<StationStatusChangedEvent>()!); break;
                case nameof(AlarmEvent): await hub.Clients.Group(group).AlarmTriggered(payload.Deserialize<AlarmEvent>()!); break;
                case nameof(AnomalyDetectedEvent): await hub.Clients.Group(group).AnomalyDetected(payload.Deserialize<AnomalyDetectedEvent>()!); break;
                case nameof(ModelPromotedEvent): await hub.Clients.Group(group).ModelPromoted(payload.Deserialize<ModelPromotedEvent>()!); break;
                default: logger.LogWarning("Ignoring unsupported integration event type {EventType}", eventType); break;
            }
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(exception, "Failed to route integration event to SignalR");
        }
    }
}
