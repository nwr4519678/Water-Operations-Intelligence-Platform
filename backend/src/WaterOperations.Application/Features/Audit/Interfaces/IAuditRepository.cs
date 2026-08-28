using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Audit.DTOs;

namespace WaterOperations.Application.Features.Audit.Interfaces;

/// <summary>
/// Repository interface for audit log querying and exports.
/// </summary>
public interface IAuditRepository
{
    Task<PagedResult<AuditEntryDto>> GetAuditAsync(
        Guid organizationId,
        AuditFilter filter,
        PaginationRequest pagination,
        CancellationToken cancellationToken);
}
