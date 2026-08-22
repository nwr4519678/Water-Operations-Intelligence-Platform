using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;

namespace WaterOperations.Application.Features.Viewer.Queries;

public sealed record GetOrganizationsQuery : IQuery<IReadOnlyList<OrganizationDto>>;

public sealed record GetRegionsQuery(Guid OrganizationId) : IQuery<IReadOnlyList<RegionDto>>;

public sealed record GetStationsQuery(Guid RegionId) : IQuery<IReadOnlyList<StationDto>>;

public sealed record GetMeasurementsQuery(Guid StationId) : IQuery<IReadOnlyList<MeasurementDto>>;

public sealed record GetAlarmsQuery(Guid StationId) : IQuery<IReadOnlyList<AlarmDto>>;

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
