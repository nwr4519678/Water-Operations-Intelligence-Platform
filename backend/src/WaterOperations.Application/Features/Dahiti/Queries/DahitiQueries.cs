using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Dahiti.DTOs;
using WaterOperations.Application.Features.Dahiti.Exceptions;
using WaterOperations.Application.Features.Dahiti.Interfaces;

namespace WaterOperations.Application.Features.Dahiti.Queries;

// ── Query records ─────────────────────────────────────────────────────────────

public sealed record GetDahitiStationsQuery : IQuery<GetDahitiStationsResult>;

public sealed record GetDahitiMonthlyTrendQuery(int DahitiId, int Months)
    : IQuery<GetDahitiMonthlyTrendResult>;

// ── Result records ────────────────────────────────────────────────────────────

/// <param name="Stations">Populated when <see cref="DataInitialized"/> is <c>true</c>.</param>
/// <param name="DataInitialized">
///   <c>false</c> when the Dahiti tables have not been created yet (maps to 503).
/// </param>
public sealed record GetDahitiStationsResult(
    List<DahitiStationDto>? Stations,
    bool DataInitialized);

public sealed record GetDahitiMonthlyTrendResult(
    List<DahitiMonthlyTrendDto>? Trend,
    bool DataInitialized);

// ── Handlers ──────────────────────────────────────────────────────────────────

public sealed class GetDahitiStationsQueryHandler(IDahitiQueryRepository repository)
    : IQueryHandler<GetDahitiStationsQuery, GetDahitiStationsResult>
{
    public async Task<GetDahitiStationsResult> Handle(
        GetDahitiStationsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var stations = await repository.GetStationsAsync(cancellationToken);
            return new GetDahitiStationsResult(stations, DataInitialized: true);
        }
        catch (DahitiDataNotInitializedException)
        {
            return new GetDahitiStationsResult(Stations: null, DataInitialized: false);
        }
    }
}

public sealed class GetDahitiMonthlyTrendQueryHandler(IDahitiQueryRepository repository)
    : IQueryHandler<GetDahitiMonthlyTrendQuery, GetDahitiMonthlyTrendResult>
{
    public async Task<GetDahitiMonthlyTrendResult> Handle(
        GetDahitiMonthlyTrendQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var trend = await repository.GetMonthlyTrendAsync(
                request.DahitiId, request.Months, cancellationToken);
            return new GetDahitiMonthlyTrendResult(trend, DataInitialized: true);
        }
        catch (DahitiDataNotInitializedException)
        {
            return new GetDahitiMonthlyTrendResult(Trend: null, DataInitialized: false);
        }
    }
}
