using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Search.DTOs;

namespace WaterOperations.Application.Features.Search.Interfaces;

/// <summary>
/// Repository interface for cross-domain search queries across stations, alarms, and users.
/// </summary>
public interface ISearchRepository
{
    Task<PagedResult<SearchResultDto>> SearchAsync(
        Guid organizationId,
        string query,
        bool includeUsers,
        PaginationRequest pagination,
        CancellationToken cancellationToken);
}
