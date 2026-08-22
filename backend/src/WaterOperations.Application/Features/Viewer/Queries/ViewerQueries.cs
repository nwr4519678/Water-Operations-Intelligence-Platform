using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;

namespace WaterOperations.Application.Features.Viewer.Queries;

public sealed record GetOrganizationsQuery : IQuery<IReadOnlyList<OrganizationDto>>;

public sealed record GetRegionsQuery(Guid OrganizationId) : IQuery<IReadOnlyList<RegionDto>>;

public sealed record GetStationsQuery(Guid RegionId) : IQuery<IReadOnlyList<StationDto>>;

public sealed record GetMeasurementsQuery(Guid StationId) : IQuery<IReadOnlyList<MeasurementDto>>;

public sealed record GetAlarmsQuery(Guid StationId) : IQuery<IReadOnlyList<AlarmDto>>;
public sealed record SearchViewerAlarmsQuery(Guid? StationId, string? Severity, string? Status, PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AlarmDto>>>, IRequireOrganization;
public sealed record GetViewerAlarmQuery(Guid AlarmId) : IQuery<ScopeResult<AlarmDto>>, IRequireOrganization;

public sealed class GetOrganizationsQueryHandler(IViewerQueryRepository queryRepository)
    : IQueryHandler<GetOrganizationsQuery, IReadOnlyList<OrganizationDto>>
{
    public Task<IReadOnlyList<OrganizationDto>> Handle(
        GetOrganizationsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetOrganizationsAsync(cancellationToken);
}

public sealed class GetRegionsQueryHandler(IViewerQueryRepository queryRepository)
    : IQueryHandler<GetRegionsQuery, IReadOnlyList<RegionDto>>
{
    public Task<IReadOnlyList<RegionDto>> Handle(
        GetRegionsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetRegionsAsync(request.OrganizationId, cancellationToken);
}

public sealed class GetStationsQueryHandler(IViewerQueryRepository queryRepository)
    : IQueryHandler<GetStationsQuery, IReadOnlyList<StationDto>>
{
    public Task<IReadOnlyList<StationDto>> Handle(
        GetStationsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetStationsAsync(request.RegionId, cancellationToken);
}

public sealed class GetMeasurementsQueryHandler(IViewerQueryRepository queryRepository)
    : IQueryHandler<GetMeasurementsQuery, IReadOnlyList<MeasurementDto>>
{
    public Task<IReadOnlyList<MeasurementDto>> Handle(
        GetMeasurementsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetMeasurementsAsync(request.StationId, cancellationToken);
}

public sealed class GetAlarmsQueryHandler(IViewerQueryRepository queryRepository)
    : IQueryHandler<GetAlarmsQuery, IReadOnlyList<AlarmDto>>
{
    public Task<IReadOnlyList<AlarmDto>> Handle(
        GetAlarmsQuery request,
        CancellationToken cancellationToken) =>
        queryRepository.GetAlarmsAsync(request.StationId, cancellationToken);
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
