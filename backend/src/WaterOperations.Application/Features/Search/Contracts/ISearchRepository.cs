using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.Search.Contracts;

public interface ISearchRepository
{
    Task<PagedResult<SearchResultDto>> SearchAsync(Guid organizationId, string query, bool includeUsers, PaginationRequest pagination, CancellationToken cancellationToken);
}
