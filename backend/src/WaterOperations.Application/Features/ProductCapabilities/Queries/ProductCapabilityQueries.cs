using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

#pragma warning disable CA1725

namespace WaterOperations.Application.Features.ProductCapabilities.Queries;

public sealed record GetAnomaliesQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AnomalyDto>>>, IRequireOrganization;
public sealed record GetModelsQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ModelDto>>>, IRequireOrganization;
public sealed record GetReportsQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ReportDto>>>, IRequireOrganization, IRequireUser;
public sealed record GetNotificationsQuery(bool UnreadOnly, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<NotificationDto>>>, IRequireOrganization, IRequireUser;
public sealed record GetUnreadNotificationCountQuery : IQuery<ScopeResult<int>>, IRequireOrganization, IRequireUser;
public sealed record GetAuditQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AuditEntryDto>>>, IRequireOrganization;
public sealed record GetUsersQuery(PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<UserAdminDto>>>, IRequireOrganization;
public sealed record GetOrganizationQuery : IQuery<ScopeResult<OrganizationDto>>, IRequireOrganization;
public sealed record GetLayoutsQuery : IQuery<ScopeResult<IReadOnlyList<DashboardLayoutDto>>>, IRequireUser;
public sealed record GetUserPreferencesQuery : IQuery<ScopeResult<UserPreferencesDto>>, IRequireOrganization, IRequireUser;
public sealed record GetNotificationPreferencesQuery : IQuery<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>, IRequireUser;
public sealed record SearchProductQuery(string Query, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<SearchResultDto>>>, IRequireOrganization;
public sealed record GetCollaborationNotesQuery(Guid StationId, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<CollaborationNoteDto>>>, IRequireOrganization;

public sealed class GetAnomaliesQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetAnomaliesQuery, ScopeResult<PagedResult<AnomalyDto>>>
{ public async Task<ScopeResult<PagedResult<AnomalyDto>>> Handle(GetAnomaliesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetAnomaliesAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetModelsQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetModelsQuery, ScopeResult<PagedResult<ModelDto>>>
{ public async Task<ScopeResult<PagedResult<ModelDto>>> Handle(GetModelsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetModelsAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetReportsQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetReportsQuery, ScopeResult<PagedResult<ReportDto>>>
{ public async Task<ScopeResult<PagedResult<ReportDto>>> Handle(GetReportsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetReportsAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Pagination, ct)); }
public sealed class GetNotificationsQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetNotificationsQuery, ScopeResult<PagedResult<NotificationDto>>>
{ public async Task<ScopeResult<PagedResult<NotificationDto>>> Handle(GetNotificationsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotificationsAsync(user.OrganizationId!.Value, user.UserId!.Value, r.UnreadOnly, r.Pagination, ct)); }
public sealed class GetUnreadNotificationCountQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetUnreadNotificationCountQuery, ScopeResult<int>>
{ public async Task<ScopeResult<int>> Handle(GetUnreadNotificationCountQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetUnreadNotificationCountAsync(user.OrganizationId!.Value, user.UserId!.Value, ct)); }
public sealed class GetAuditQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetAuditQuery, ScopeResult<PagedResult<AuditEntryDto>>>
{ public async Task<ScopeResult<PagedResult<AuditEntryDto>>> Handle(GetAuditQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetAuditAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetUsersQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetUsersQuery, ScopeResult<PagedResult<UserAdminDto>>>
{ public async Task<ScopeResult<PagedResult<UserAdminDto>>> Handle(GetUsersQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetUsersAsync(user.OrganizationId!.Value, r.Pagination, ct)); }
public sealed class GetOrganizationQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetOrganizationQuery, ScopeResult<OrganizationDto>>
{ public async Task<ScopeResult<OrganizationDto>> Handle(GetOrganizationQuery r, CancellationToken ct) => (await repository.GetOrganizationAsync(user.OrganizationId!.Value, ct)) is { } value ? ScopeResult.Authorized(value) : ScopeResult.NotFound<OrganizationDto>(); }
public sealed class GetLayoutsQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetLayoutsQuery, ScopeResult<IReadOnlyList<DashboardLayoutDto>>>
{ public async Task<ScopeResult<IReadOnlyList<DashboardLayoutDto>>> Handle(GetLayoutsQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetLayoutsAsync(user.UserId!.Value, ct)); }
public sealed class GetUserPreferencesQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetUserPreferencesQuery, ScopeResult<UserPreferencesDto>>
{ public async Task<ScopeResult<UserPreferencesDto>> Handle(GetUserPreferencesQuery r, CancellationToken ct) => (await repository.GetUserPreferencesAsync(user.OrganizationId!.Value, user.UserId!.Value, ct)) is { } value ? ScopeResult.Authorized(value) : ScopeResult.NotFound<UserPreferencesDto>(); }
public sealed class GetNotificationPreferencesQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetNotificationPreferencesQuery, ScopeResult<IReadOnlyList<NotificationPreferenceDto>>>
{ public async Task<ScopeResult<IReadOnlyList<NotificationPreferenceDto>>> Handle(GetNotificationPreferencesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotificationPreferencesAsync(user.UserId!.Value, ct)); }
public sealed class SearchProductQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<SearchProductQuery, ScopeResult<PagedResult<SearchResultDto>>>
{ public async Task<ScopeResult<PagedResult<SearchResultDto>>> Handle(SearchProductQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.SearchAsync(user.OrganizationId!.Value, r.Query, r.Pagination, ct)); }
public sealed class GetCollaborationNotesQueryHandler(IProductCapabilityRepository repository, ICurrentUser user) : IQueryHandler<GetCollaborationNotesQuery, ScopeResult<PagedResult<CollaborationNoteDto>>>
{ public async Task<ScopeResult<PagedResult<CollaborationNoteDto>>> Handle(GetCollaborationNotesQuery r, CancellationToken ct) => ScopeResult.Authorized(await repository.GetNotesAsync(user.OrganizationId!.Value, r.StationId, r.Pagination, ct)); }

#pragma warning restore CA1725
