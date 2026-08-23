using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.Administration.Contracts;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Administration;

public sealed class EfAdministrationRepository(WaterOperationsDbContext db) : IAdministrationRepository
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
    public Task<PagedResult<UserAdminDto>> GetUsersAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken) => PageAsync(Db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.DisplayName).Select(x => new UserAdminDto(x.UserId, x.Email, x.DisplayName, x.ClientType, x.IsActive, x.CreatedAtUtc)), pagination, cancellationToken);
    public Task<OrganizationDto?> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) => Db.Organizations.AsNoTracking().Where(x => x.OrganizationId == organizationId).Select(x => new OrganizationDto(x.OrganizationId, x.Name, x.Slug, x.LogoUrl, x.DefaultLocale, x.DefaultTimeZone, x.IsActive)).SingleOrDefaultAsync(cancellationToken);
    public async Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(Guid userId, CancellationToken cancellationToken) => await Db.DashboardLayouts.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.IsDefault).ThenBy(x => x.LayoutName).Select(x => new DashboardLayoutDto(x.DashboardLayoutId, x.LayoutName, x.WidgetsJson, x.IsDefault, x.UpdatedAtUtc)).ToListAsync(cancellationToken);
    public async Task<bool> SaveLayoutAsync(Guid userId, string name, string widgetsJson, bool isDefault, CancellationToken cancellationToken) { if (isDefault) await Db.DashboardLayouts.Where(x => x.UserId == userId).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsDefault, false), cancellationToken); var layout = await Db.DashboardLayouts.SingleOrDefaultAsync(x => x.UserId == userId && x.LayoutName == name, cancellationToken); if (layout is null) Db.DashboardLayouts.Add(new DashboardLayout { UserId = userId, LayoutName = name, WidgetsJson = widgetsJson, IsDefault = isDefault, UpdatedAtUtc = DateTime.UtcNow }); else { layout.WidgetsJson = widgetsJson; layout.IsDefault = isDefault; layout.UpdatedAtUtc = DateTime.UtcNow; } await Db.SaveChangesAsync(cancellationToken); return true; }
    public async Task<bool> UpdateOrganizationAsync(Guid organizationId, string name, string? logoUrl, string locale, string timeZone, CancellationToken cancellationToken) { var organization = await Db.Organizations.SingleOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken); if (organization is null) return false; organization.Name = name; organization.LogoUrl = logoUrl; organization.DefaultLocale = locale; organization.DefaultTimeZone = timeZone; organization.UpdatedAtUtc = DateTime.UtcNow; await Db.SaveChangesAsync(cancellationToken); return true; }
    public async Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken cancellationToken)
    {
        var user = await Db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken);
        if (user is null) return false;
        if (!isActive && user.IsActive && await Db.UserRoles.AnyAsync(x => x.UserId == userId && x.Role.Code == "ADMIN", cancellationToken))
        {
            var activeAdmins = await Db.UserRoles.CountAsync(x => x.Role.Code == "ADMIN" && x.User.OrganizationId == organizationId && x.User.IsActive, cancellationToken);
            if (activeAdmins <= 1) return false;
        }
        user.IsActive = isActive; user.UpdatedAtUtc = DateTime.UtcNow; await Db.SaveChangesAsync(cancellationToken); return true;
    }
    public Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) => Db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.UserId == userId).Select(x => new UserPreferencesDto(x.Theme, x.PreferredLocale, x.PreferredTimeZone, x.DecimalPrecision)).SingleOrDefaultAsync(cancellationToken);
    public async Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken cancellationToken) { var user = await Db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken); if (user is null) return false; user.Theme = theme; user.PreferredLocale = locale; user.PreferredTimeZone = timeZone; user.DecimalPrecision = decimalPrecision; user.UpdatedAtUtc = DateTime.UtcNow; await Db.SaveChangesAsync(cancellationToken); return true; }
    public async Task<IReadOnlyList<RegionAdminDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) => await Db.Regions.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.Name).Select(x => new RegionAdminDto(x.RegionId, x.OrganizationId, x.Code, x.Name, x.Description, x.IsActive, x.CreatedAtUtc)).ToListAsync(cancellationToken);
    public async Task<RegionAdminDto?> CreateRegionAsync(Guid organizationId, CreateRegionRequest request, CancellationToken cancellationToken)
    {
        if (await Db.Regions.AnyAsync(x => x.OrganizationId == organizationId && (x.Code == request.Code || x.Name == request.Name), cancellationToken)) return null;
        var region = new Region { RegionId = Guid.NewGuid(), OrganizationId = organizationId, Code = request.Code, Name = request.Name, Description = request.Description, BoundaryJson = request.BoundaryJson, IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        Db.Regions.Add(region);
        await Db.SaveChangesAsync(cancellationToken);
        return new RegionAdminDto(region.RegionId, region.OrganizationId, region.Code, region.Name, region.Description, region.IsActive, region.CreatedAtUtc);
    }
    public async Task<RegionAdminDto?> UpdateRegionAsync(Guid organizationId, Guid regionId, UpdateRegionRequest request, CancellationToken cancellationToken)
    {
        var region = await Db.Regions.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.RegionId == regionId, cancellationToken);
        if (region is null) return null;
        region.Code = request.Code; region.Name = request.Name; region.Description = request.Description; region.BoundaryJson = request.BoundaryJson; region.IsActive = request.IsActive;
        await Db.SaveChangesAsync(cancellationToken);
        return new RegionAdminDto(region.RegionId, region.OrganizationId, region.Code, region.Name, region.Description, region.IsActive, region.CreatedAtUtc);
    }
    public async Task<bool> SetRegionActiveAsync(Guid organizationId, Guid regionId, bool isActive, CancellationToken cancellationToken)
    {
        var region = await Db.Regions.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.RegionId == regionId, cancellationToken);
        if (region is null) return false;
        region.IsActive = isActive; await Db.SaveChangesAsync(cancellationToken); return true;
    }
    public async Task<IReadOnlyList<UserRoleDto>> GetUserRolesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) => await Db.UserRoles.AsNoTracking().Where(x => x.UserId == userId && x.User.OrganizationId == organizationId).Select(x => new UserRoleDto(x.UserId, x.RoleId, x.Role.Code, x.Role.DisplayName, x.AssignedAtUtc)).ToListAsync(cancellationToken);
    public async Task<bool> AssignUserRoleAsync(Guid organizationId, Guid actorUserId, Guid userId, int roleId, CancellationToken cancellationToken)
    {
        if (!await Db.Users.AnyAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken) || !await Db.Roles.AnyAsync(x => x.RoleId == roleId, cancellationToken)) return false;
        if (await Db.UserRoles.AnyAsync(x => x.UserId == userId && x.RoleId == roleId, cancellationToken)) return true;
        Db.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId, AssignedAtUtc = DateTime.UtcNow, AssignedByUserId = actorUserId });
        await Db.SaveChangesAsync(cancellationToken); return true;
    }
    public async Task<int> RevokeUserSessionsAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken)
    {
        var sessions = await Db.Sessions.Where(x => x.UserId == userId && x.User.OrganizationId == organizationId && x.RevokedAtUtc == null).ToListAsync(cancellationToken);
        foreach (var session in sessions) session.RevokedAtUtc = DateTime.UtcNow;
        await Db.SaveChangesAsync(cancellationToken); return sessions.Count;
    }
}
