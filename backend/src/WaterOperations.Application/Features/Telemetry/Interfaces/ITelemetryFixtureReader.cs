using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Interfaces;

public interface ITelemetryFixtureReader
{
    public IReadOnlyList<TelemetryFixturePoint>? Read(
        string organization,
        string region);
}
