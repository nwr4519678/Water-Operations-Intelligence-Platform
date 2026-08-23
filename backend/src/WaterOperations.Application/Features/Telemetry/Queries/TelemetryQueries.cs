using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;

namespace WaterOperations.Application.Features.Telemetry.Queries;

public sealed record GetTelemetryQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    Guid? StationId,
    int? ParameterId,
    int? Limit)
    : IQuery<ScopeResult<TelemetryResponse>>, IRequireOrganization;

public sealed record GetChartQuery(
    Guid StationId,
    int[] ParameterIds,
    DateTimeOffset From,
    DateTimeOffset To,
    int Limit)
    : IQuery<ScopeResult<ChartResponse>>, IRequireOrganization;

public sealed class GetTelemetryQueryHandler(
    ITelemetryQueryRepository telemetry,
    ICurrentUser currentUser)
    : IQueryHandler<GetTelemetryQuery, ScopeResult<TelemetryResponse>>
{
    public async Task<ScopeResult<TelemetryResponse>> Handle(
        GetTelemetryQuery request,
        CancellationToken cancellationToken)
    {
        var result = await telemetry.GetAsync(
            currentUser.OrganizationId!.Value,
            currentUser.RegionId,
            new TelemetryQuery(request.From, request.To, request.StationId, request.ParameterId, request.Limit),
            cancellationToken);

        var limit = Math.Clamp(request.Limit ?? 100, 1, 1000);

        var items = result.Select(x => new TelemetryItem(
            long.TryParse(x.Id, out var id) ? id : 0L,
            x.StationId,
            x.ParameterId,
            x.TimestampUtc,
            x.Value,
            x.Unit,
            x.QualityFlag,
            x.IsInterpolated)).ToList();

        return ScopeResult.Authorized(new TelemetryResponse(items, limit));
    }
}

public sealed class GetChartQueryHandler(
    ITelemetryQueryRepository telemetry,
    ICurrentUser currentUser)
    : IQueryHandler<GetChartQuery, ScopeResult<ChartResponse>>
{
    public async Task<ScopeResult<ChartResponse>> Handle(
        GetChartQuery request,
        CancellationToken cancellationToken)
    {
        var result = await telemetry.GetChartAsync(
            currentUser.OrganizationId!.Value,
            currentUser.RegionId,
            new ChartQuery(request.StationId, request.ParameterIds, request.From, request.To, request.Limit),
            cancellationToken);

        if (result is null)
        {
            return ScopeResult.NotFound<ChartResponse>();
        }

        var limit = Math.Clamp(request.Limit, 1, 10_000);
        return ScopeResult.Authorized(new ChartResponse(result, result.Count == limit, limit));
    }
}
