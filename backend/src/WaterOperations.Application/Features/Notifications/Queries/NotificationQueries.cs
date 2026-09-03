using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Application.Features.Notifications.Interfaces;
using WaterOperations.Application.Features.Dahiti.Exceptions;
using WaterOperations.Application.Features.Dahiti.Interfaces;

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
    IDahitiQueryRepository dahitiRepository,
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

        // Data-freshness warnings are derived from the authoritative DaHITI
        // feed at request time. They are not frontend/demo records and do not
        // get persisted as duplicate alarm rows.
        try
        {
            var staleItems = (await dahitiRepository.GetStationsAsync(cancellationToken))
                .Where(station => !station.LastObservedAtUtc.HasValue
                    || station.LastObservedAtUtc.Value < DateTimeOffset.UtcNow.Subtract(TimeSpan.FromDays(90)))
                .Select(station =>
                {
                    var lastDateStr = station.LastObservedAtUtc.HasValue
                        ? station.LastObservedAtUtc.Value.ToString("yyyy-MM-dd")
                        : "Historical baseline";
                    return new NotificationDto(
                        -station.DahitiId,
                        $"Telemetry Freshness Warning · {station.Name}",
                        $"Station {station.Name} (DAHITI-{station.DahitiId}) has not recorded recent observations (last recorded: {lastDateStr}). Scheduled for maintenance follow-up.",
                        "WARNING",
                        "IN_APP",
                        false,
                        (station.LastSyncedAtUtc ?? DateTimeOffset.UtcNow).UtcDateTime);
                })
                .Where(item => !request.UnreadOnly || !item.IsRead)
                .ToList();

            if (staleItems.Count > 0)
            {
                var merged = result.Data
                    .Concat(staleItems)
                    .OrderByDescending(item => item.CreatedAtUtc)
                    .ToList();
                var page = Math.Max(1, request.Pagination.Page);
                var pageSize = Math.Clamp(request.Pagination.PageSize, 1, 100);
                var total = merged.Count;
                result = new PagedResult<NotificationDto>(
                    merged.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
                    total,
                    page,
                    pageSize);
            }
        }
        catch (DahitiDataNotInitializedException)
        {
            // The regular Operations notification stream remains available
            // until the DaHITI schema has been initialized.
        }

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetUnreadNotificationCountQueryHandler(
    INotificationRepository repository,
    IDahitiQueryRepository dahitiRepository,
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

        try
        {
            count += (await dahitiRepository.GetStationsAsync(cancellationToken))
                .Count(station => !station.LastObservedAtUtc.HasValue
                    || station.LastObservedAtUtc.Value < DateTimeOffset.UtcNow.Subtract(TimeSpan.FromDays(90)));
        }
        catch (DahitiDataNotInitializedException)
        {
            // Keep the persisted notification count when DaHITI is not ready.
        }

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
