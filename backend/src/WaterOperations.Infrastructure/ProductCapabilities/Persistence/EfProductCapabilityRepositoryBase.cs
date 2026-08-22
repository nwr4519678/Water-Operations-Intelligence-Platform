using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Persistence;

public abstract class EfProductCapabilityRepositoryBase(WaterOperationsDbContext db)
{
    protected WaterOperationsDbContext Db { get; } = db;

    protected static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, PaginationRequest request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 100);
        var total = await query.CountAsync(cancellationToken);
        var data = await query.Skip((page - 1) * size).Take(size).ToListAsync(cancellationToken);
        return new PagedResult<T>(data, page, size, total);
    }
}
