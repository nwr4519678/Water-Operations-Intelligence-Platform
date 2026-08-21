using WaterOperations.Application.Features.Operations.DTOs;

namespace WaterOperations.Application.Features.Operations.Interfaces;

public interface IThresholdService
{
    Task<IReadOnlyList<ThresholdDto>> ListAsync(Guid stationId, int parameterId, CancellationToken cancellationToken);
    Task<ThresholdDto> CreateAsync(ThresholdRequest request, CancellationToken cancellationToken);
}
