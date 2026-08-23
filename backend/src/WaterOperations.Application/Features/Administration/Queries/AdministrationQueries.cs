using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.Contracts;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.Administration.Queries;

public sealed record GetAdminRegionsQuery : IQuery<ScopeResult<IReadOnlyList<RegionAdminDto>>>, IRequireOrganization;
public sealed record GetUserRolesQuery(Guid UserId) : IQuery<ScopeResult<IReadOnlyList<UserRoleDto>>>, IRequireOrganization;

public sealed class GetAdminRegionsQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetAdminRegionsQuery, ScopeResult<IReadOnlyList<RegionAdminDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<RegionAdminDto>>> Handle(GetAdminRegionsQuery request, CancellationToken cancellationToken) => ScopeResult.Authorized(await repository.GetRegionsAsync(user.OrganizationId!.Value, cancellationToken));
}

public sealed class GetUserRolesQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetUserRolesQuery, ScopeResult<IReadOnlyList<UserRoleDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<UserRoleDto>>> Handle(GetUserRolesQuery request, CancellationToken cancellationToken) => ScopeResult.Authorized(await repository.GetUserRolesAsync(user.OrganizationId!.Value, request.UserId, cancellationToken));
}
