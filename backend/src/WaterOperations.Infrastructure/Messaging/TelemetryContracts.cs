namespace WaterOperations.Infrastructure.Messaging;

public interface ITelemetryClient
{
    public Task MeasurementUpdated(object payload);

    public Task StationStatusChanged(object payload);

    public Task AlarmTriggered(object payload);

    public Task AlarmAcknowledged(object payload);

    public Task AlarmResolved(object payload);

    public Task AnomalyDetected(object payload);

    public Task ModelPromoted(object payload);
}
