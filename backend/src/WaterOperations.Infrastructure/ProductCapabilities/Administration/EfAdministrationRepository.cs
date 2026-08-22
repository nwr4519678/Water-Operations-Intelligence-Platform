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
    public async Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken cancellationToken) { var user = await Db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken); if (user is null) return false; user.IsActive = isActive; user.UpdatedAtUtc = DateTime.UtcNow; await Db.SaveChangesAsync(cancellationToken); return true; }
    public Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) => Db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.UserId == userId).Select(x => new UserPreferencesDto(x.Theme, x.PreferredLocale, x.PreferredTimeZone, x.DecimalPrecision)).SingleOrDefaultAsync(cancellationToken);
    public async Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken cancellationToken) { var user = await Db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, cancellationToken); if (user is null) return false; user.Theme = theme; user.PreferredLocale = locale; user.PreferredTimeZone = timeZone; user.DecimalPrecision = decimalPrecision; user.UpdatedAtUtc = DateTime.UtcNow; await Db.SaveChangesAsync(cancellationToken); return true; }
}
