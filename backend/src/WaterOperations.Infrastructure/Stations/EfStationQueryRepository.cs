using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Stations.DTOs;
using WaterOperations.Application.Features.Stations.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Stations;

public sealed class EfStationQueryRepository(IRepositoryContext repository) : IStationQueryRepository
{
    public async Task<PagedResult<StationListItemDto>> SearchAsync(
        Guid organizationId,
        StationSearchRequest request,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = repository.Query<Station>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);
        if (request.RegionId.HasValue)
        {
            query = query.Where(x => x.RegionId == request.RegionId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(x =>
                x.Name.Contains(request.Search) || x.StationCode.Contains(request.Search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        if (request.MinLatitude.HasValue)
        {
            query = query.Where(x => x.Latitude >= request.MinLatitude.Value);
        }

        if (request.MaxLatitude.HasValue)
        {
            query = query.Where(x => x.Latitude <= request.MaxLatitude.Value);
        }

        if (request.MinLongitude.HasValue)
        {
            query = query.Where(x => x.Longitude >= request.MinLongitude.Value);
        }

        if (request.MaxLongitude.HasValue)
        {
            query = query.Where(x => x.Longitude <= request.MaxLongitude.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(x => x.StationCode)
            .ThenBy(x => x.StationId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new StationListItemDto(
                x.StationId,
                x.OrganizationId,
                x.RegionId,
                x.StationCode,
                x.Name,
                x.Latitude,
                x.Longitude,
                x.Status,
                x.LastSeenAtUtc,
                x.IsActive))
            .ToListAsync(cancellationToken);
        return new PagedResult<StationListItemDto>(rows, page, pageSize, total);
    }

    public async Task<StationDetailsDto?> GetAsync(
        Guid organizationId,
        Guid stationId,
        CancellationToken cancellationToken) =>
        await repository.Query<Station>()
            .AsNoTracking()
            .Where(x => x.StationId == stationId && x.OrganizationId == organizationId)
            .Select(x => new StationDetailsDto(
                x.StationId,
                x.OrganizationId,
                x.RegionId,
                x.StationCode,
                x.Name,
                x.Description,
                x.Latitude,
                x.Longitude,
                x.ElevationMeters,
                x.Status,
                x.LastSeenAtUtc,
                x.IsActive,
                x.StationParameters
                    .Where(p => p.IsEnabled)
                    .Select(p => new StationParameterDto(p.ParameterId, p.SourceUnit))
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);
}
