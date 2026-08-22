using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface IAdministrationRepository
{
    Task<PagedResult<UserAdminDto>> GetUsersAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<OrganizationDto?> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> SaveLayoutAsync(Guid userId, string name, string widgetsJson, bool isDefault, CancellationToken cancellationToken);
    Task<bool> UpdateOrganizationAsync(Guid organizationId, string name, string? logoUrl, string locale, string timeZone, CancellationToken cancellationToken);
    Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken cancellationToken);
    Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken cancellationToken);
}
