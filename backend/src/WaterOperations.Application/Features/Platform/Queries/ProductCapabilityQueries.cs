using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.AI.Contracts;
using WaterOperations.Application.Features.Reports.Contracts;
using WaterOperations.Application.Features.Notifications.Contracts;
using WaterOperations.Application.Features.Audit.Contracts;
using WaterOperations.Application.Features.Collaboration.Contracts;
using WaterOperations.Application.Features.Administration.Contracts;
using WaterOperations.Application.Features.Search.Contracts;
using System.Text;
using System.Globalization;

#pragma warning disable CA1725

namespace WaterOperations.Application.Features.ProductCapabilities.Queries;

public sealed record GetAnomaliesQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AnomalyDto>>>, IRequireOrganization;
public sealed record GetModelsQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ModelDto>>>, IRequireOrganization;
public sealed record GetReportsQuery(ReportFilter Filter, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ReportDto>>>, IRequireOrganization, IRequireUser;
public sealed record GetNotificationsQuery(bool UnreadOnly, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<NotificationDto>>>, IRequireOrganization, IRequireUser;
public sealed record GetUnreadNotificationCountQuery : IQuery<ScopeResult<int>>, IRequireOrganization, IRequireUser;
public sealed record GetAuditQuery(AuditFilter Filter, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AuditEntryDto>>>, IRequireOrganization;
public sealed record ExportAuditQuery(AuditFilter Filter) : IQuery<ScopeResult<string>>, IRequireOrganization;
public sealed record GetUsersQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<UserAdminDto>>>, IRequireOrganization;
public sealed record GetOrganizationQuery : IQuery<ScopeResult<OrganizationDto>>, IRequireOrganization;
public sealed record GetLayoutsQuery : IQuery<ScopeResult<IReadOnlyList<DashboardLayoutDto>>>, IRequireUser;
public sealed record GetUserPreferencesQuery : IQuery<ScopeResult<UserPreferencesDto>>, IRequireOrganization, IRequireUser;
public sealed record GetNotificationPreferencesQuery : IQuery<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>, IRequireUser;
public sealed record SearchProductQuery(string Query, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<SearchResultDto>>>, IRequireOrganization, IRequireUser;
public sealed record GetCollaborationNotesQuery(Guid StationId, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<CollaborationNoteDto>>>, IRequireOrganization;
public sealed record GetSharedSnapshotQuery(string Token) : IQuery<ScopeResult<SharedSnapshotContentDto>>;

public sealed class GetAnomaliesQueryHandler(IAiModelRepository repository, ICurrentUser user) : IQueryHandler<GetAnomaliesQuery, ScopeResult<PagedResult<AnomalyDto>>>
{ public async Task<ScopeResult<PagedResult<AnomalyDto>>> Handle(GetAnomaliesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetAnomaliesAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetModelsQueryHandler(IAiModelRepository repository, ICurrentUser user) : IQueryHandler<GetModelsQuery, ScopeResult<PagedResult<ModelDto>>>
{ public async Task<ScopeResult<PagedResult<ModelDto>>> Handle(GetModelsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetModelsAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetReportsQueryHandler(IReportRepository repository, ICurrentUser user) : IQueryHandler<GetReportsQuery, ScopeResult<PagedResult<ReportDto>>>
{ public async Task<ScopeResult<PagedResult<ReportDto>>> Handle(GetReportsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetReportsAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Filter, r.Pagination, ct)); }
public sealed class GetNotificationsQueryHandler(INotificationRepository repository, ICurrentUser user) : IQueryHandler<GetNotificationsQuery, ScopeResult<PagedResult<NotificationDto>>>
{ public async Task<ScopeResult<PagedResult<NotificationDto>>> Handle(GetNotificationsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotificationsAsync(user.OrganizationId!.Value, user.UserId!.Value, r.UnreadOnly, r.Pagination, ct)); }
public sealed class GetUnreadNotificationCountQueryHandler(INotificationRepository repository, ICurrentUser user) : IQueryHandler<GetUnreadNotificationCountQuery, ScopeResult<int>>
{ public async Task<ScopeResult<int>> Handle(GetUnreadNotificationCountQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetUnreadNotificationCountAsync(user.OrganizationId!.Value, user.UserId!.Value, ct)); }
public sealed class GetAuditQueryHandler(IAuditRepository repository, ICurrentUser user) : IQueryHandler<GetAuditQuery, ScopeResult<PagedResult<AuditEntryDto>>>
{ public async Task<ScopeResult<PagedResult<AuditEntryDto>>> Handle(GetAuditQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetAuditAsync(user.OrganizationId!.Value, r.Filter, r.Pagination, ct)); }
public sealed class ExportAuditQueryHandler(IAuditRepository repository, ICurrentUser user) : IQueryHandler<ExportAuditQuery, ScopeResult<string>>
{
    public async Task<ScopeResult<string>> Handle(ExportAuditQuery r, CancellationToken ct)
    {
        var csv = new StringBuilder("id,actionCode,entityType,entityId,success,occurredAtUtc,actorUserId,requestId\n");
        var page = 1;
        while (true)
        {
            var result = await repository.GetAuditAsync(user.OrganizationId!.Value, r.Filter, new PaginationRequest(page, 100), ct);
            foreach (var item in result.Data) csv.AppendLine(string.Join(',', item.Id, Csv(item.ActionCode), Csv(item.EntityType), Csv(item.EntityId), item.Success, item.OccurredAtUtc.ToString("O", CultureInfo.InvariantCulture), item.ActorUserId, Csv(item.RequestId)));
            if (result.Data.Count == 0 || page * 100 >= result.Total) break;
            page++;
        }
        return ScopeResult.Authorized(csv.ToString());
    }

    private static string Csv(string? value) => value is null ? string.Empty : $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}
public sealed class GetUsersQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetUsersQuery, ScopeResult<PagedResult<UserAdminDto>>>
{ public async Task<ScopeResult<PagedResult<UserAdminDto>>> Handle(GetUsersQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetUsersAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetOrganizationQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetOrganizationQuery, ScopeResult<OrganizationDto>>
{ public async Task<ScopeResult<OrganizationDto>> Handle(GetOrganizationQuery r, CancellationToken ct) => (await repository.GetOrganizationAsync(user.OrganizationId!.Value, ct)) is { } value ? ScopeResult.Authorized(value) : ScopeResult.NotFound<OrganizationDto>(); }
public sealed class GetLayoutsQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetLayoutsQuery, ScopeResult<IReadOnlyList<DashboardLayoutDto>>>
{ public async Task<ScopeResult<IReadOnlyList<DashboardLayoutDto>>> Handle(GetLayoutsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetLayoutsAsync(user.UserId!.Value, ct)); }
public sealed class GetUserPreferencesQueryHandler(IAdministrationRepository repository, ICurrentUser user) : IQueryHandler<GetUserPreferencesQuery, ScopeResult<UserPreferencesDto>>
{ public async Task<ScopeResult<UserPreferencesDto>> Handle(GetUserPreferencesQuery r, CancellationToken ct) => (await repository.GetUserPreferencesAsync(user.OrganizationId!.Value, user.UserId!.Value, ct)) is { } value ? ScopeResult.Authorized(value) : ScopeResult.NotFound<UserPreferencesDto>(); }
public sealed class GetNotificationPreferencesQueryHandler(INotificationRepository repository, ICurrentUser user) : IQueryHandler<GetNotificationPreferencesQuery, ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>
{ public async Task<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>> Handle(GetNotificationPreferencesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotificationPreferencesAsync(user.UserId!.Value, ct)); }
public sealed class SearchProductQueryHandler(ISearchRepository repository, ICurrentUser user) : IQueryHandler<SearchProductQuery, ScopeResult<PagedResult<SearchResultDto>>>
{ public async Task<ScopeResult<PagedResult<SearchResultDto>>> Handle(SearchProductQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.SearchAsync(user.OrganizationId!.Value, r.Query, user.Roles.Contains("ADMIN", StringComparer.OrdinalIgnoreCase), r.Pagination, ct)); }
public sealed class GetCollaborationNotesQueryHandler(ICollaborationRepository repository, ICurrentUser user) : IQueryHandler<GetCollaborationNotesQuery, ScopeResult<PagedResult<CollaborationNoteDto>>>
{ public async Task<ScopeResult<PagedResult<CollaborationNoteDto>>> Handle(GetCollaborationNotesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotesAsync(user.OrganizationId!.Value, r.StationId, r.Pagination, ct)); }

public sealed class GetSharedSnapshotQueryHandler(ICollaborationRepository repository) : IQueryHandler<GetSharedSnapshotQuery, ScopeResult<SharedSnapshotContentDto>>
{ public async Task<ScopeResult<SharedSnapshotContentDto>> Handle(GetSharedSnapshotQuery r, CancellationToken ct) => (await repository.GetSnapshotAsync(r.Token, ct)) is { } value ? ScopeResult.Authorized(value) : ScopeResult.NotFound<SharedSnapshotContentDto>(); }

#pragma warning restore CA1725
