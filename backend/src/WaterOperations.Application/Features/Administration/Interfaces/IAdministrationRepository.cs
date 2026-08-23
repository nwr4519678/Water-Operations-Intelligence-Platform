using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Administration.DTOs;

namespace WaterOperations.Application.Features.Administration.Interfaces;

/// <summary>
/// Repository interface for administrative system configuration, users, roles, organizations, and region management.
/// </summary>
public interface IAdministrationRepository
{
    Task<PagedResult<UserAdminDto>> GetUsersAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken);

    Task<OrganizationDto?> GetOrganizationAsync(
        Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<bool> SaveLayoutAsync(
        Guid userId,
        string name,
        string widgetsJson,
        bool isDefault,
        CancellationToken cancellationToken);

    Task<bool> UpdateOrganizationAsync(
        Guid organizationId,
        string name,
        string? logoUrl,
        string locale,
        string timeZone,
        CancellationToken cancellationToken);

    Task<bool> SetUserActiveAsync(
        Guid organizationId,
        Guid userId,
        bool isActive,
        CancellationToken cancellationToken);

    Task<UserPreferencesDto?> GetUserPreferencesAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken);

    Task<bool> UpdateUserPreferencesAsync(
        Guid organizationId,
        Guid userId,
        string theme,
        string locale,
        string timeZone,
        byte decimalPrecision,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<RegionAdminDto>> GetRegionsAsync(
        Guid organizationId,
        CancellationToken cancellationToken);

    Task<RegionAdminDto?> CreateRegionAsync(
        Guid organizationId,
        CreateRegionRequest request,
        CancellationToken cancellationToken);

    Task<RegionAdminDto?> UpdateRegionAsync(
        Guid organizationId,
        Guid regionId,
        UpdateRegionRequest request,
        CancellationToken cancellationToken);

    Task<bool> SetRegionActiveAsync(
        Guid organizationId,
        Guid regionId,
        bool isActive,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UserRoleDto>> GetUserRolesAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken);

    Task<bool> AssignUserRoleAsync(
        Guid organizationId,
        Guid actorUserId,
        Guid userId,
        int roleId,
        CancellationToken cancellationToken);

    Task<int> RevokeUserSessionsAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken);
}
