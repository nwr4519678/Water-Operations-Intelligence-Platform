using WaterOperations.Application.Features.Dahiti.DTOs;

namespace WaterOperations.Application.Features.Dahiti.Interfaces;

public interface IDahitiQueryRepository
{
    /// <summary>
    /// Returns all Dahiti stations with their latest observation data.
    /// Throws <see cref="DahitiDataNotInitializedException"/> if the underlying tables do not exist yet.
    /// </summary>
    Task<List<DahitiStationDto>> GetStationsAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Returns monthly trend aggregations for the given station over the specified window.
    /// Throws <see cref="DahitiDataNotInitializedException"/> if the underlying tables do not exist yet.
    /// </summary>
    Task<List<DahitiMonthlyTrendDto>> GetMonthlyTrendAsync(
        int dahitiId,
        int months,
        CancellationToken cancellationToken);
}
