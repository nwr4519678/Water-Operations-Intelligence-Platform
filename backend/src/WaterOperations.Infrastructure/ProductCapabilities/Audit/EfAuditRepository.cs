using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.ProductCapabilities.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Audit;

public sealed class EfAuditRepository(WaterOperationsDbContext db) : EfProductCapabilityRepositoryBase(db), IAuditRepository
{
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
