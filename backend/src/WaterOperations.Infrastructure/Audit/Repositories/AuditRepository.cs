using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Audit.DTOs;
using WaterOperations.Application.Features.Audit.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Audit.Repositories;

public sealed class AuditRepository(WaterOperationsDbContext db) : IAuditRepository
{
    public async Task<PagedResult<AuditEntryDto>> GetAuditAsync(
        Guid organizationId,
        AuditFilter filter,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.AuditLogs
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (filter.FromUtc.HasValue)
        {
            query = query.Where(x => x.OccurredAtUtc >= filter.FromUtc.Value);
        }

        if (filter.ToUtc.HasValue)
        {
            query = query.Where(x => x.OccurredAtUtc <= filter.ToUtc.Value);
        }

        if (filter.ActorUserId.HasValue)
        {
            query = query.Where(x => x.ActorUserId == filter.ActorUserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.ActionCode))
        {
            query = query.Where(x => EF.Functions.ILike(x.ActionCode, $"%{filter.ActionCode.Trim()}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.EntityType))
        {
            query = query.Where(x => EF.Functions.ILike(x.EntityType!, $"%{filter.EntityType.Trim()}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.EntityId))
        {
            query = query.Where(x => x.EntityId == filter.EntityId);
        }

        query = query.OrderByDescending(x => x.OccurredAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AuditEntryDto(
                x.AuditLogId,
                x.ActionCode,
                x.EntityType,
                x.EntityId,
                x.Success,
                x.OccurredAtUtc,
                x.ActorUserId,
                x.RequestId,
                x.BeforeJson,
                x.AfterJson))
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditEntryDto>(items, total, page, pageSize);
    }
}
