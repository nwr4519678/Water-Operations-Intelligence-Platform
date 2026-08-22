using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface IAuditRepository
{
    Task<PagedResult<AuditEntryDto>> GetAuditAsync(Guid organizationId, AuditFilter filter, PaginationRequest pagination, CancellationToken cancellationToken);
}
