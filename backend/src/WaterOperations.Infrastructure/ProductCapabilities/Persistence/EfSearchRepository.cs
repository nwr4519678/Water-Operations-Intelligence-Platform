using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Persistence;

public sealed class EfSearchRepository(WaterOperationsDbContext db) : EfProductCapabilityRepositoryBase(db), ISearchRepository
{
    public Task<PagedResult<SearchResultDto>> SearchAsync(Guid organizationId, string query, bool includeUsers, PaginationRequest pagination, CancellationToken cancellationToken)
    {
        var pattern = query.Trim();
        var stations = Db.Stations.AsNoTracking().Where(x => x.OrganizationId == organizationId && (EF.Functions.ILike(x.Name, $"%{pattern}%") || EF.Functions.ILike(x.StationCode, $"%{pattern}%"))).Select(x => new SearchResultDto("station", x.StationId.ToString(), x.Name, x.StationCode));
        var alarms = Db.Alarms.AsNoTracking().Where(x => x.OrganizationId == organizationId && EF.Functions.ILike(x.Message, $"%{pattern}%")).Select(x => new SearchResultDto("alarm", x.AlarmId.ToString(), x.Message, x.Severity));
        var reports = Db.Reports.AsNoTracking().Where(x => x.OrganizationId == organizationId && EF.Functions.ILike(x.Format, $"%{pattern}%")).Select(x => new SearchResultDto("report", x.ReportId.ToString(), $"{x.Format} report", x.Status));
        var results = stations.Concat(alarms).Concat(reports);
        if (includeUsers)
        {
            var users = Db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId && (EF.Functions.ILike(x.DisplayName, $"%{pattern}%") || EF.Functions.ILike(x.Email, $"%{pattern}%"))).Select(x => new SearchResultDto("user", x.UserId.ToString(), x.DisplayName, x.Email));
            results = results.Concat(users);
        }
        return PageAsync(results.OrderBy(x => x.Title), pagination, cancellationToken);
    }
}
