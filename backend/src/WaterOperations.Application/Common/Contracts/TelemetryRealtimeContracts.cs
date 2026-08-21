namespace WaterOperations.Application.Common.Contracts;

public sealed record MeasurementUpdatedEvent(string StationId, DateTime TimestampUtc, decimal Value, string QualityFlag);
public sealed record StationStatusChangedEvent(string StationId, string Status, DateTime ChangedAtUtc);
public sealed record AlarmEvent(string AlarmId, string StationId, string Severity, string Status, DateTime OccurredAtUtc);
public sealed record AnomalyDetectedEvent(string StationId, decimal Score, DateTime DetectedAtUtc);
public sealed record ModelPromotedEvent(string ModelId, string Version, DateTime PromotedAtUtc);

public interface ITelemetryClient
{
    Task MeasurementUpdated(MeasurementUpdatedEvent payload);
    Task StationStatusChanged(StationStatusChangedEvent payload);
    Task AlarmTriggered(AlarmEvent payload);
    Task AlarmAcknowledged(AlarmEvent payload);
    Task AlarmResolved(AlarmEvent payload);
    Task AnomalyDetected(AnomalyDetectedEvent payload);
    Task ModelPromoted(ModelPromotedEvent payload);
    Task Protocol(string version);
}
