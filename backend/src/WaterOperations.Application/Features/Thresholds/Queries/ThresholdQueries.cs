using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Thresholds.DTOs;
using WaterOperations.Application.Features.Thresholds.Interfaces;

namespace WaterOperations.Application.Features.Thresholds.Queries;

public sealed record GetThresholdsQuery(
    Guid? StationId,
    int? ParameterId,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<ThresholdDto>>>, IRequireOrganization;

public sealed class GetThresholdsQueryHandler(
    IThresholdRepository repository,
    ICurrentUser user) : IQueryHandler<GetThresholdsQuery, ScopeResult<PagedResult<ThresholdDto>>>
{
    public async Task<ScopeResult<PagedResult<ThresholdDto>>> Handle(GetThresholdsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.SearchAsync(
            user.OrganizationId!.Value,
            request.StationId,
            request.ParameterId,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}
