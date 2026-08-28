using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Common.Security;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Security;

public sealed class StationAuthorizationService(
    WaterOperationsDbContext dbContext,
    ICurrentUser currentUser) : IStationAuthorizationService
{
    public async Task<bool> CanAccessStationAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        try
        {
            await DirectGuardStationAsync(stationId, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> CanAccessRegionAsync(Guid regionId, CancellationToken cancellationToken = default)
    {
        try
        {
            await DirectGuardRegionAsync(regionId, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task DirectGuardStationAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        if (!currentUser.OrganizationId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var orgId = currentUser.OrganizationId.Value;

        var station = await dbContext.Stations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.StationId == stationId && x.OrganizationId == orgId, cancellationToken);

        if (station == null)
        {
            // Return 404 to prevent cross-tenant IDOR enumeration
            throw new NotFoundException($"Station '{stationId}' was not found.");
        }

        if (currentUser.RegionId.HasValue && station.RegionId != currentUser.RegionId.Value)
        {
            // 403 Forbidden when user is restricted to a different region within the same organization
            throw new ForbiddenAccessException();
        }
    }

    public async Task DirectGuardRegionAsync(Guid regionId, CancellationToken cancellationToken = default)
    {
        if (!currentUser.OrganizationId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        var orgId = currentUser.OrganizationId.Value;

        var region = await dbContext.Regions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.RegionId == regionId && x.OrganizationId == orgId, cancellationToken);

        if (region == null)
        {
            throw new NotFoundException($"Region '{regionId}' was not found.");
        }

        if (currentUser.RegionId.HasValue && region.RegionId != currentUser.RegionId.Value)
        {
            throw new ForbiddenAccessException();
        }
    }
}
