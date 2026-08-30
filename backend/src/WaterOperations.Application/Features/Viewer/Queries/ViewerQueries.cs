using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;

namespace WaterOperations.Application.Features.Viewer.Queries;

public sealed record GetOrganizationsQuery
    : IQuery<ScopeResult<IReadOnlyList<OrganizationDto>>>, IRequireOrganization, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"viewer:orgs:{currentUser.OrganizationId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(15);
}

/// <summary>
/// CA-2 fix: Removed redundant OrganizationId parameter — the handler reads it
/// directly from ICurrentUser.OrganizationId, which already carries the scoped value.
/// </summary>
public sealed record GetRegionsQuery
    : IQuery<ScopeResult<IReadOnlyList<RegionDto>>>, IRequireOrganization, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"viewer:regions:{currentUser.OrganizationId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(15);
}

public sealed record GetStationsQuery(Guid RegionId)
    : IQuery<ScopeResult<IReadOnlyList<StationDto>>>, IRequireOrganization, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"viewer:stations:{currentUser.OrganizationId}:{RegionId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed record GetMeasurementsQuery(Guid StationId)
    : IQuery<ScopeResult<IReadOnlyList<MeasurementDto>>>, IRequireOrganization;

public sealed record GetAlarmsQuery(Guid StationId)
    : IQuery<ScopeResult<IReadOnlyList<AlarmDto>>>, IRequireOrganization;

public sealed record SearchViewerAlarmsQuery(
    Guid? StationId,
    string? Severity,
    string? Status,
    PaginationRequest Pagination)
    : IQuery<ScopeResult<PagedResult<AlarmDto>>>, IRequireOrganization;

public sealed record GetViewerAlarmQuery(Guid AlarmId)
    : IQuery<ScopeResult<AlarmDto>>, IRequireOrganization, ICacheableQuery
{
    public string GetCacheKey(ICurrentUser currentUser) => $"viewer:alarm:{currentUser.OrganizationId}:{AlarmId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetOrganizationsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetOrganizationsQuery, ScopeResult<IReadOnlyList<OrganizationDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<OrganizationDto>>> Handle(
        GetOrganizationsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await queryRepository.GetOrganizationsAsync(
            currentUser.OrganizationId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetRegionsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetRegionsQuery, ScopeResult<IReadOnlyList<RegionDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<RegionDto>>> Handle(
        GetRegionsQuery request,
        CancellationToken cancellationToken)
    {
        // CA-2 fix: both organizationId args collapse into the same ICurrentUser value.
        var organizationId = currentUser.OrganizationId!.Value;
        var result = await queryRepository.GetRegionsAsync(
            organizationId,
            organizationId,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetStationsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetStationsQuery, ScopeResult<IReadOnlyList<StationDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<StationDto>>> Handle(
        GetStationsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await queryRepository.GetStationsAsync(
            currentUser.OrganizationId!.Value,
            request.RegionId,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetMeasurementsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetMeasurementsQuery, ScopeResult<IReadOnlyList<MeasurementDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<MeasurementDto>>> Handle(
        GetMeasurementsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await queryRepository.GetMeasurementsAsync(
            currentUser.OrganizationId!.Value,
            request.StationId,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetAlarmsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetAlarmsQuery, ScopeResult<IReadOnlyList<AlarmDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<AlarmDto>>> Handle(
        GetAlarmsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await queryRepository.GetAlarmsAsync(
            currentUser.OrganizationId!.Value,
            request.StationId,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class SearchViewerAlarmsQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<SearchViewerAlarmsQuery, ScopeResult<PagedResult<AlarmDto>>>
{
    public async Task<ScopeResult<PagedResult<AlarmDto>>> Handle(
        SearchViewerAlarmsQuery request,
        CancellationToken cancellationToken)
    {
        var result = await queryRepository.SearchAlarmsAsync(
            currentUser.OrganizationId!.Value,
            request.StationId,
            request.Severity,
            request.Status,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetViewerAlarmQueryHandler(
    IViewerQueryRepository queryRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetViewerAlarmQuery, ScopeResult<AlarmDto>>
{
    public async Task<ScopeResult<AlarmDto>> Handle(
        GetViewerAlarmQuery request,
        CancellationToken cancellationToken)
    {
        var alarm = await queryRepository.GetAlarmAsync(
            currentUser.OrganizationId!.Value,
            request.AlarmId,
            cancellationToken);

        return alarm is not null
            ? ScopeResult.Authorized(alarm)
            : ScopeResult.NotFound<AlarmDto>();
    }
}
