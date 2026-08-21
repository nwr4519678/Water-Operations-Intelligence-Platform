using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Interfaces;

public interface IDataQualityService
{
    Task<IReadOnlyList<DataQualityDto>> ReadAsync(DateTimeOffset? fromUtc, DateTimeOffset? toUtc, CancellationToken cancellationToken);
}
