using WaterOperations.Application.Features.Charts.DTOs;

namespace WaterOperations.Application.Features.Charts.Interfaces;

public interface IChartAnnotationRepository
{
    Task<IReadOnlyList<ChartAnnotationDto>> GetByStationAsync(Guid organizationId, Guid stationId, DateTimeOffset? from, DateTimeOffset? until, CancellationToken cancellationToken = default);
    Task<ChartAnnotationDto> CreateAsync(Guid organizationId, Guid userId, Guid stationId, CreateChartAnnotationRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid organizationId, Guid userId, long annotationId, CancellationToken cancellationToken = default);
}
