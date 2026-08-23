using MediatR;
using AutoMapper;
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
    : IQuery<ScopeResult<TelemetryResponse>>;

public sealed record GetChartQuery(
    Guid StationId,
    int[] ParameterIds,
    DateTimeOffset From,
    DateTimeOffset To,
    int Limit)
    : IQuery<ChartQueryResult>, IRequireOrganization;

public sealed record ChartQueryResult(
    bool IsAuthorized,
    bool IsValid,
    ChartResponse? Value);

public sealed class GetTelemetryQueryHandler(
    ITelemetryQueryRepository telemetry,
    IMapper mapper,
    ITelemetryFixtureReader fixtureReader,
    ICurrentUser currentUser)
    : IQueryHandler<GetTelemetryQuery, ScopeResult<TelemetryResponse>>
{
    public async Task<ScopeResult<TelemetryResponse>> Handle(
        GetTelemetryQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.OrganizationId.HasValue)
        {
            var fixture = fixtureReader.Read(
                currentUser.Organization ?? string.Empty,
                currentUser.Region ?? string.Empty);
            return fixture is null
                ? ScopeResult.Forbidden<TelemetryResponse>()
                : ScopeResult.Authorized(
                    new TelemetryResponse([], fixture.Count, fixture));
        }

        var result = await telemetry.GetAsync(
            currentUser.OrganizationId!.Value,
            currentUser.RegionId,
            new TelemetryQuery(request.From, request.To, request.StationId, request.ParameterId, request.Limit),
            cancellationToken);
        var limit = Math.Clamp(request.Limit ?? 100, 1, 1000);
        return ScopeResult.Authorized(
            new TelemetryResponse(result.Select(mapper.Map<TelemetryItem>).ToList(), limit));
    }

}

public sealed class GetChartQueryHandler(
    ITelemetryQueryRepository telemetry,
    ICurrentUser currentUser)
    : IQueryHandler<GetChartQuery, ChartQueryResult>
{
    public async Task<ChartQueryResult> Handle(
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
            return new(true, true, null);
        }

        var limit = Math.Clamp(request.Limit, 1, 10_000);
        return new(true, true, new ChartResponse(result, result.Count == limit, limit));
    }
}
