using MediatR;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;

namespace WaterOperations.Application.Features.Viewer.Queries;

public sealed record GetOrganizationsQuery : IRequest<IReadOnlyList<OrganizationDto>>;

public sealed record GetRegionsQuery(Guid OrganizationId) : IRequest<IReadOnlyList<RegionDto>>;

public sealed record GetStationsQuery(Guid RegionId) : IRequest<IReadOnlyList<StationDto>>;

public sealed record GetMeasurementsQuery(Guid StationId) : IRequest<IReadOnlyList<MeasurementDto>>;

public sealed record GetAlarmsQuery(Guid StationId) : IRequest<IReadOnlyList<AlarmDto>>;

public sealed class GetOrganizationsQueryHandler(IViewerReadService viewerReadService)
    : IRequestHandler<GetOrganizationsQuery, IReadOnlyList<OrganizationDto>>
{
    public Task<IReadOnlyList<OrganizationDto>> Handle(GetOrganizationsQuery request, CancellationToken cancellationToken) =>
        viewerReadService.GetOrganizationsAsync(cancellationToken);
}

public sealed class GetRegionsQueryHandler(IViewerReadService viewerReadService)
    : IRequestHandler<GetRegionsQuery, IReadOnlyList<RegionDto>>
{
    public Task<IReadOnlyList<RegionDto>> Handle(GetRegionsQuery request, CancellationToken cancellationToken) =>
        viewerReadService.GetRegionsAsync(request.OrganizationId, cancellationToken);
}

public sealed class GetStationsQueryHandler(IViewerReadService viewerReadService)
    : IRequestHandler<GetStationsQuery, IReadOnlyList<StationDto>>
{
    public Task<IReadOnlyList<StationDto>> Handle(GetStationsQuery request, CancellationToken cancellationToken) =>
        viewerReadService.GetStationsAsync(request.RegionId, cancellationToken);
}

public sealed class GetMeasurementsQueryHandler(IViewerReadService viewerReadService)
    : IRequestHandler<GetMeasurementsQuery, IReadOnlyList<MeasurementDto>>
{
    public Task<IReadOnlyList<MeasurementDto>> Handle(GetMeasurementsQuery request, CancellationToken cancellationToken) =>
        viewerReadService.GetMeasurementsAsync(request.StationId, cancellationToken);
}

public sealed class GetAlarmsQueryHandler(IViewerReadService viewerReadService)
    : IRequestHandler<GetAlarmsQuery, IReadOnlyList<AlarmDto>>
{
    public Task<IReadOnlyList<AlarmDto>> Handle(GetAlarmsQuery request, CancellationToken cancellationToken) =>
        viewerReadService.GetAlarmsAsync(request.StationId, cancellationToken);
}
