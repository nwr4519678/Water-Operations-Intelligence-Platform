using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Interfaces;

public interface ITelemetryQueryRepository
{
    public Task<IReadOnlyList<TelemetryPoint>> GetAsync(
        Guid organizationId,
        Guid? regionId,
        TelemetryQuery query,
        CancellationToken cancellationToken);

    public Task<IReadOnlyList<ChartPoint>?> GetChartAsync(
        Guid organizationId,
        Guid? regionId,
        ChartQuery query,
        CancellationToken cancellationToken);
}
