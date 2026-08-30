using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;

namespace WaterOperations.Application.Features.Settings.Queries;

public sealed record GetLayoutsQuery : IQuery<ScopeResult<IReadOnlyList<DashboardLayoutDto>>>, IRequireOrganization, IRequireUser, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"settings:layouts:{currentUser.UserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed record GetUserPreferencesQuery : IQuery<ScopeResult<UserPreferencesDto>>, IRequireOrganization, IRequireUser, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"settings:prefs:{currentUser.UserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetLayoutsQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetLayoutsQuery, ScopeResult<IReadOnlyList<DashboardLayoutDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<DashboardLayoutDto>>> Handle(
        GetLayoutsQuery request,
        CancellationToken cancellationToken)
    {
        var layouts = await repository.GetLayoutsAsync(
            user.UserId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(layouts);
    }
}

public sealed class GetUserPreferencesQueryHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : IQueryHandler<GetUserPreferencesQuery, ScopeResult<UserPreferencesDto>>
{
    public async Task<ScopeResult<UserPreferencesDto>> Handle(
        GetUserPreferencesQuery request,
        CancellationToken cancellationToken)
    {
        var prefs = await repository.GetUserPreferencesAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            cancellationToken);

        return prefs is null
            ? ScopeResult.NotFound<UserPreferencesDto>()
            : ScopeResult.Authorized(prefs);
    }
}
