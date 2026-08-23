using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.Charts.DTOs;
using WaterOperations.Application.Features.Charts.Interfaces;

namespace WaterOperations.Application.Features.Charts.Queries;

public sealed record GetChartAnnotationsQuery(Guid StationId, DateTimeOffset? From, DateTimeOffset? To)
    : IQuery<ScopeResult<IReadOnlyList<ChartAnnotationDto>>>, IRequireOrganization;

public sealed class GetChartAnnotationsQueryHandler(
    IChartAnnotationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : IQueryHandler<GetChartAnnotationsQuery, ScopeResult<IReadOnlyList<ChartAnnotationDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<ChartAnnotationDto>>> Handle(GetChartAnnotationsQuery request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        var result = await repository.GetByStationAsync(
            user.OrganizationId!.Value,
            request.StationId,
            request.From,
            request.To,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}
