using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;

namespace WaterOperations.Application.Features.Viewer.Queries;

public sealed record GetOrganizationsQuery : IQuery<IReadOnlyList<OrganizationDto>>, IRequireOrganization;

public sealed record GetRegionsQuery(Guid OrganizationId) : IQuery<IReadOnlyList<RegionDto>>, IRequireOrganization;

public sealed record GetStationsQuery(Guid RegionId) : IQuery<IReadOnlyList<StationDto>>, IRequireOrganization;

public sealed record GetMeasurementsQuery(Guid StationId) : IQuery<IReadOnlyList<MeasurementDto>>, IRequireOrganization;

public sealed record GetAlarmsQuery(Guid StationId) : IQuery<IReadOnlyList<AlarmDto>>, IRequireOrganization;
public sealed record SearchViewerAlarmsQuery(Guid? StationId, string? Severity, string? Status, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AlarmDto>>>, IRequireOrganization;
public sealed record GetViewerAlarmQuery(Guid AlarmId) : IQuery<ScopeResult<AlarmDto>>, IRequireOrganization;

public sealed class GetOrganizationsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser)
    : IQueryHandler<GetOrganizationsQuery, IReadOnlyList<OrganizationDto>>
{
    public Task<IReadOnlyList<OrganizationDto>> Handle(
        GetOrganizationsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetOrganizationsAsync(currentUser.OrganizationId!.Value, cancellationToken);
}

public sealed class GetRegionsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser? currentUser = null)
    : IQueryHandler<GetRegionsQuery, IReadOnlyList<RegionDto>>
{
    public Task<IReadOnlyList<RegionDto>> Handle(
        GetRegionsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetRegionsAsync(currentUser?.OrganizationId ?? request.OrganizationId, request.OrganizationId, cancellationToken);
}

public sealed class GetStationsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser)
    : IQueryHandler<GetStationsQuery, IReadOnlyList<StationDto>>
{
    public Task<IReadOnlyList<StationDto>> Handle(
        GetStationsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetStationsAsync(currentUser.OrganizationId!.Value, request.RegionId, cancellationToken);
}

public sealed class GetMeasurementsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser)
    : IQueryHandler<GetMeasurementsQuery, IReadOnlyList<MeasurementDto>>
{
    public Task<IReadOnlyList<MeasurementDto>> Handle(
        GetMeasurementsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetMeasurementsAsync(currentUser.OrganizationId!.Value, request.StationId, cancellationToken);
}

public sealed class GetAlarmsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser)
    : IQueryHandler<GetAlarmsQuery, IReadOnlyList<AlarmDto>>
{
    public Task<IReadOnlyList<AlarmDto>> Handle(
        GetAlarmsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetAlarmsAsync(currentUser.OrganizationId!.Value, request.StationId, cancellationToken);
}

public sealed class SearchViewerAlarmsQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser) : IQueryHandler<SearchViewerAlarmsQuery, ScopeResult<PagedResult<AlarmDto>>>
{
    public async Task<ScopeResult<PagedResult<AlarmDto>>> Handle(SearchViewerAlarmsQuery request, CancellationToken cancellationToken) =>
        ScopeResult.Authorized(await queryRepository.SearchAlarmsAsync(currentUser.OrganizationId!.Value, request.StationId, request.Severity, request.Status, request.Pagination, cancellationToken));
}

public sealed class GetViewerAlarmQueryHandler(IViewerQueryRepository queryRepository, ICurrentUser currentUser) : IQueryHandler<GetViewerAlarmQuery, ScopeResult<AlarmDto>>
{
    public async Task<ScopeResult<AlarmDto>> Handle(GetViewerAlarmQuery request, CancellationToken cancellationToken) =>
        (await queryRepository.GetAlarmAsync(currentUser.OrganizationId!.Value, request.AlarmId, cancellationToken)) is { } value
            ? ScopeResult.Authorized(value)
            : ScopeResult.NotFound<AlarmDto>();
}
