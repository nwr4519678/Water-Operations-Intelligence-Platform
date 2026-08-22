namespace WaterOperations.Infrastructure.Messaging;

public interface ITelemetryClient
{
    public Task MeasurementUpdated(RealtimeEventEnvelope payload);

    public Task StationStatusChanged(RealtimeEventEnvelope payload);

    public Task AlarmTriggered(RealtimeEventEnvelope payload);

    public Task AlarmAcknowledged(RealtimeEventEnvelope payload);

    public Task AlarmResolved(RealtimeEventEnvelope payload);

    public Task AnomalyDetected(RealtimeEventEnvelope payload);

    public Task ModelPromoted(RealtimeEventEnvelope payload);

    public Task DataQualityChanged(RealtimeEventEnvelope payload);

    public Task AiAvailabilityChanged(RealtimeEventEnvelope payload);
}

public sealed record RealtimeEventEnvelope(
    string ProtocolVersion,
    string EventType,
    DateTime OccurredAtUtc,
    System.Text.Json.JsonElement Payload,
    bool IsReplay = false);
