using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;

namespace WaterOperations.Infrastructure.Telemetry;

public sealed class TelemetryFixtureReader(TelemetryStore? telemetryStore = null) : ITelemetryFixtureReader
{
    public IReadOnlyList<TelemetryFixturePoint>? Read(string organization, string region) =>
        telemetryStore?
            .ForScope(organization, region)
            .Select(x => new TelemetryFixturePoint(
                x.Id,
                x.Organization,
                x.Region,
                x.Value))
            .ToList();
}
