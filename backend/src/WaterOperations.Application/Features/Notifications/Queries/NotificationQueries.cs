using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Application.Features.Notifications.Interfaces;

namespace WaterOperations.Application.Features.Notifications.Queries;

public sealed record GetNotificationsQuery(
    bool UnreadOnly,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<NotificationDto>>>, IRequireOrganization, IRequireUser;

public sealed record GetUnreadNotificationCountQuery : IQuery<ScopeResult<int>>, IRequireOrganization, IRequireUser;

public sealed record GetNotificationPreferencesQuery : IQuery<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>, IRequireOrganization, IRequireUser, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"notifications:prefs:{currentUser.UserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetNotificationsQueryHandler(
    INotificationRepository repository,
    ICurrentUser user) : IQueryHandler<GetNotificationsQuery, ScopeResult<PagedResult<NotificationDto>>>
{
    public async Task<ScopeResult<PagedResult<NotificationDto>>> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetNotificationsAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.UnreadOnly,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetUnreadNotificationCountQueryHandler(
    INotificationRepository repository,
    ICurrentUser user) : IQueryHandler<GetUnreadNotificationCountQuery, ScopeResult<int>>
{
    public async Task<ScopeResult<int>> Handle(
        GetUnreadNotificationCountQuery request,
        CancellationToken cancellationToken)
    {
        var count = await repository.GetUnreadNotificationCountAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(count);
    }
}

public sealed class GetNotificationPreferencesQueryHandler(
    INotificationRepository repository,
    ICurrentUser user) : IQueryHandler<GetNotificationPreferencesQuery, ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>> Handle(
        GetNotificationPreferencesQuery request,
        CancellationToken cancellationToken)
    {
        var prefs = await repository.GetNotificationPreferencesAsync(
            user.UserId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(prefs);
    }
}
