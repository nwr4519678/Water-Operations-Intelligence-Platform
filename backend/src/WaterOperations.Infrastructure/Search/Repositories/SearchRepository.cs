using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Search.DTOs;
using WaterOperations.Application.Features.Search.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Search.Repositories;

public sealed class SearchRepository(WaterOperationsDbContext db) : ISearchRepository
{
    public async Task<PagedResult<SearchResultDto>> SearchAsync(
        Guid organizationId,
        string query,
        bool includeUsers,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var results = new List<SearchResultDto>();
        var term = $"%{query.Trim()}%";

        // Stations
        var stations = await db.Stations
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && (EF.Functions.Like(x.Name, term) || EF.Functions.Like(x.StationCode, term)))
            .Take(20)
            .Select(x => new SearchResultDto("Station", x.StationId.ToString(), x.Name, x.StationCode))
            .ToListAsync(cancellationToken);
        results.AddRange(stations);

        // Alarms
        var alarms = await db.Alarms
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && EF.Functions.Like(x.Message, term))
            .Take(20)
            .Select(x => new SearchResultDto("Alarm", x.AlarmId.ToString(), x.Message, x.Severity))
            .ToListAsync(cancellationToken);
        results.AddRange(alarms);

        // Users (if admin)
        if (includeUsers)
        {
            var users = await db.Users
                .AsNoTracking()
                .Where(x => x.OrganizationId == organizationId && (EF.Functions.Like(x.DisplayName, term) || EF.Functions.Like(x.Email, term)))
                .Take(20)
                .Select(x => new SearchResultDto("User", x.UserId.ToString(), x.DisplayName, x.Email))
                .ToListAsync(cancellationToken);
            results.AddRange(users);
        }

        var total = results.Count;
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);
        var pagedItems = results.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<SearchResultDto>(pagedItems, total, page, pageSize);
    }
}
