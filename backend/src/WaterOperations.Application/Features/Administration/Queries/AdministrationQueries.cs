using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;

namespace WaterOperations.Application.Features.Administration.Queries;

public sealed record GetUsersQuery(
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<UserAdminDto>>>, IRequireOrganization, IRequireUser;

public sealed record GetOrganizationQuery : IQuery<ScopeResult<OrganizationDto>>, IRequireOrganization, IRequireUser, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"admin:org:{currentUser.OrganizationId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed record GetAdminRegionsQuery : IQuery<ScopeResult<IReadOnlyList<RegionAdminDto>>>, IRequireOrganization, IRequireUser, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"admin:regions:{currentUser.OrganizationId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed record GetUserRolesQuery(
    Guid UserId) : IQuery<ScopeResult<IReadOnlyList<UserRoleDto>>>, IRequireOrganization, IRequireUser;

public sealed class GetUsersQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetUsersQuery, ScopeResult<PagedResult<UserAdminDto>>>
{
    public async Task<ScopeResult<PagedResult<UserAdminDto>>> Handle(
        GetUsersQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetUsersAsync(
            user.OrganizationId!.Value,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetOrganizationQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetOrganizationQuery, ScopeResult<OrganizationDto>>
{
    public async Task<ScopeResult<OrganizationDto>> Handle(
        GetOrganizationQuery request,
        CancellationToken cancellationToken)
    {
        var org = await repository.GetOrganizationAsync(
            user.OrganizationId!.Value,
            cancellationToken);

        return org is null
            ? ScopeResult.NotFound<OrganizationDto>()
            : ScopeResult.Authorized(org);
    }
}

public sealed class GetAdminRegionsQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetAdminRegionsQuery, ScopeResult<IReadOnlyList<RegionAdminDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<RegionAdminDto>>> Handle(
        GetAdminRegionsQuery request,
        CancellationToken cancellationToken)
    {
        var regions = await repository.GetRegionsAsync(
            user.OrganizationId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(regions);
    }
}

public sealed class GetUserRolesQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetUserRolesQuery, ScopeResult<IReadOnlyList<UserRoleDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<UserRoleDto>>> Handle(
        GetUserRolesQuery request,
        CancellationToken cancellationToken)
    {
        var roles = await repository.GetUserRolesAsync(
            user.OrganizationId!.Value,
            request.UserId,
            cancellationToken);

        return ScopeResult.Authorized(roles);
    }
}
