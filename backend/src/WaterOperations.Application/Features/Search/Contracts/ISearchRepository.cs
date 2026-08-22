using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface ISearchRepository
{
    Task<PagedResult<SearchResultDto>> SearchAsync(Guid organizationId, string query, bool includeUsers, PaginationRequest pagination, CancellationToken cancellationToken);
}
