using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Administration.Repositories;

public sealed class AdministrationRepository(WaterOperationsDbContext db) : IAdministrationRepository
{
    public async Task<PagedResult<UserAdminDto>> GetUsersAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.Users
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderBy(x => x.DisplayName);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserAdminDto(
                x.UserId,
                x.Email,
                x.DisplayName,
                x.ClientType,
                x.IsActive,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserAdminDto>(items, total, page, pageSize);
    }

    public async Task<OrganizationDto?> GetOrganizationAsync(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var org = await db.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);

        return org is null
            ? null
            : new OrganizationDto(
                org.OrganizationId,
                org.Name,
                org.Slug,
                org.LogoUrl,
                org.DefaultLocale,
                org.DefaultTimeZone,
                org.IsActive);
    }

    public async Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await db.DashboardLayouts
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.LayoutName)
            .Select(x => new DashboardLayoutDto(
                x.DashboardLayoutId,
                x.LayoutName,
                x.WidgetsJson,
                x.IsDefault,
                x.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SaveLayoutAsync(
        Guid userId,
        string name,
        string widgetsJson,
        bool isDefault,
        CancellationToken cancellationToken)
    {
        var existing = await db.DashboardLayouts
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LayoutName == name, cancellationToken);

        if (isDefault)
        {
            var defaults = await db.DashboardLayouts
                .Where(x => x.UserId == userId && x.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var d in defaults)
            {
                d.IsDefault = false;
            }
        }

        if (existing is null)
        {
            db.DashboardLayouts.Add(new DashboardLayout
            {
                UserId = userId,
                LayoutName = name,
                WidgetsJson = widgetsJson,
                IsDefault = isDefault,
                UpdatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            existing.WidgetsJson = widgetsJson;
            existing.IsDefault = isDefault;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateOrganizationAsync(
        Guid organizationId,
        string name,
        string? logoUrl,
        string locale,
        string timeZone,
        CancellationToken cancellationToken)
    {
        var org = await db.Organizations
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);

        if (org is null)
        {
            return false;
        }

        org.Name = name;
        org.LogoUrl = logoUrl;
        org.DefaultLocale = locale;
        org.DefaultTimeZone = timeZone;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SetUserActiveAsync(
        Guid organizationId,
        Guid userId,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken);

        if (user is null)
        {
            return false;
        }

        user.IsActive = isActive;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<UserPreferencesDto?> GetUserPreferencesAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var u = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken);

        return u is null
            ? new UserPreferencesDto("SYSTEM", "en-US", "UTC", 2)
            : new UserPreferencesDto(u.Theme ?? "SYSTEM", u.PreferredLocale ?? "en-US", u.PreferredTimeZone ?? "UTC", u.DecimalPrecision);
    }

    public async Task<bool> UpdateUserPreferencesAsync(
        Guid organizationId,
        Guid userId,
        string theme,
        string locale,
        string timeZone,
        byte decimalPrecision,
        CancellationToken cancellationToken)
    {
        var u = await db.Users
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken);

        if (u is null)
        {
            return false;
        }

        u.Theme = theme;
        u.PreferredLocale = locale;
        u.PreferredTimeZone = timeZone;
        u.DecimalPrecision = decimalPrecision;
        u.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<RegionAdminDto>> GetRegionsAsync(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        return await db.Regions
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderBy(x => x.Name)
            .Select(x => new RegionAdminDto(
                x.RegionId,
                x.OrganizationId,
                x.Code,
                x.Name,
                x.Description,
                x.IsActive,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<RegionAdminDto?> CreateRegionAsync(
        Guid organizationId,
        CreateRegionRequest request,
        CancellationToken cancellationToken)
    {
        var region = new Region
        {
            OrganizationId = organizationId,
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            BoundaryJson = request.BoundaryJson,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Regions.Add(region);
        await db.SaveChangesAsync(cancellationToken);

        return new RegionAdminDto(
            region.RegionId,
            region.OrganizationId,
            region.Code,
            region.Name,
            region.Description,
            region.IsActive,
            region.CreatedAtUtc);
    }

    public async Task<RegionAdminDto?> UpdateRegionAsync(
        Guid organizationId,
        Guid regionId,
        UpdateRegionRequest request,
        CancellationToken cancellationToken)
    {
        var region = await db.Regions
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.RegionId == regionId, cancellationToken);

        if (region is null)
        {
            return null;
        }

        region.Code = request.Code;
        region.Name = request.Name;
        region.Description = request.Description;
        region.BoundaryJson = request.BoundaryJson;
        region.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);

        return new RegionAdminDto(
            region.RegionId,
            region.OrganizationId,
            region.Code,
            region.Name,
            region.Description,
            region.IsActive,
            region.CreatedAtUtc);
    }

    public async Task<bool> SetRegionActiveAsync(
        Guid organizationId,
        Guid regionId,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var region = await db.Regions
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.RegionId == regionId, cancellationToken);

        if (region is null)
        {
            return false;
        }

        region.IsActive = isActive;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<UserRoleDto>> GetUserRolesAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await db.UserRoles
            .AsNoTracking()
            .Include(x => x.Role)
            .Where(x => x.UserId == userId)
            .Select(x => new UserRoleDto(
                x.UserId,
                x.RoleId,
                x.Role.Code,
                x.Role.DisplayName,
                x.AssignedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AssignUserRoleAsync(
        Guid organizationId,
        Guid actorUserId,
        Guid userId,
        int roleId,
        CancellationToken cancellationToken)
    {
        var existing = await db.UserRoles
            .FirstOrDefaultAsync(x => x.UserId == userId && x.RoleId == roleId, cancellationToken);

        if (existing is null)
        {
            db.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = roleId,
                AssignedByUserId = actorUserId,
                AssignedAtUtc = DateTime.UtcNow
            });

            await db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public async Task<int> RevokeUserSessionsAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var sessions = await db.Sessions
            .Where(x => x.UserId == userId && x.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var s in sessions)
        {
            s.RevokedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return sessions.Count;
    }
}
