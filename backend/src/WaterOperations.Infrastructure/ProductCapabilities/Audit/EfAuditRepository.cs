using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.Audit.Contracts;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Audit;

public sealed class EfAuditRepository(WaterOperationsDbContext db) : IAuditRepository
{
    private WaterOperationsDbContext Db { get; } = db;

    private static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, PaginationRequest request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 100);
        var total = await query.CountAsync(cancellationToken);
        var data = await query.Skip((page - 1) * size).Take(size).ToListAsync(cancellationToken);
        return new PagedResult<T>(data, page, size, total);
    }
    public Task<PagedResult<AuditEntryDto>> GetAuditAsync(Guid organizationId, AuditFilter filter, PaginationRequest pagination, CancellationToken cancellationToken)
    {
        var query = Db.AuditLogs.AsNoTracking().Where(x => x.OrganizationId == organizationId);
        if (filter.FromUtc is not null) query = query.Where(x => x.OccurredAtUtc >= filter.FromUtc.Value);
        if (filter.ToUtc is not null) query = query.Where(x => x.OccurredAtUtc <= filter.ToUtc.Value);
        if (filter.ActorUserId is not null) query = query.Where(x => x.ActorUserId == filter.ActorUserId.Value);
        if (!string.IsNullOrWhiteSpace(filter.ActionCode)) query = query.Where(x => x.ActionCode == filter.ActionCode);
        if (!string.IsNullOrWhiteSpace(filter.EntityType)) query = query.Where(x => x.EntityType == filter.EntityType);
        if (!string.IsNullOrWhiteSpace(filter.EntityId)) query = query.Where(x => x.EntityId == filter.EntityId);
        return PageAsync(query.OrderByDescending(x => x.OccurredAtUtc).Select(x => new AuditEntryDto(x.AuditLogId, x.ActionCode, x.EntityType, x.EntityId, x.Success, x.OccurredAtUtc, x.ActorUserId, x.RequestId, x.BeforeJson, x.AfterJson)), pagination, cancellationToken);
    }
}
