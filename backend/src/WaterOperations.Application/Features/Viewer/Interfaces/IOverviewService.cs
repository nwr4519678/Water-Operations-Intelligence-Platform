using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Viewer.Interfaces;

public interface IOverviewService
{
    Task<OverviewDto> GetAsync(DateTimeOffset? asOfUtc, CancellationToken cancellationToken);
}
