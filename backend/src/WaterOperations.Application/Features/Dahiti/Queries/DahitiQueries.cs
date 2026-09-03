using MediatR;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Application.Features.Dahiti.DTOs;
using WaterOperations.Application.Features.Dahiti.Exceptions;
using WaterOperations.Application.Features.Dahiti.Interfaces;

namespace WaterOperations.Application.Features.Dahiti.Queries;

// ── Query records ─────────────────────────────────────────────────────────────

public sealed record GetDahitiStationsQuery : IQuery<GetDahitiStationsResult>;

public sealed record GetDahitiMonthlyTrendQuery(int DahitiId, int Months)
    : IQuery<GetDahitiMonthlyTrendResult>;

public sealed record GetDahitiReadingsQuery(int DahitiId, int Limit)
    : IQuery<GetDahitiReadingsResult>;

public sealed record GetDahitiAiInsightQuery(int DahitiId, string InsightType)
    : IQuery<DahitiAiInsightDto>, IRequireOrganization;

public sealed record GetDahitiAiAnomaliesQuery
    : IQuery<IReadOnlyList<DahitiAiAnomalyDto>>, IRequireOrganization;

internal static class DahitiAiDataQuality
{
    public static List<AiTelemetryObservation> KeepUsable(
        IEnumerable<AiTelemetryObservation> observations)
    {
        return observations
            .Where(observation =>
                !double.IsNaN(observation.Value)
                && !double.IsInfinity(observation.Value))
            .ToList();
    }

    public static bool IsFresh(DateTimeOffset? lastObservedAtUtc) =>
        lastObservedAtUtc.HasValue;
}

internal static class DahitiAiStationIdentity
{
    public static Guid FromDahitiId(int dahitiId) =>
        new(SHA256.HashData(Encoding.UTF8.GetBytes($"DAHITI-{dahitiId}"))[..16]);
}

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

public sealed record GetDahitiReadingsResult(
    List<DahitiReadingDto>? Readings,
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
                request.DahitiId, Math.Clamp(request.Months, 1, 2400), cancellationToken);
            return new GetDahitiMonthlyTrendResult(trend, DataInitialized: true);
        }
        catch (DahitiDataNotInitializedException)
        {
            return new GetDahitiMonthlyTrendResult(Trend: null, DataInitialized: false);
        }
    }
}

public sealed class GetDahitiReadingsQueryHandler(IDahitiQueryRepository repository)
    : IQueryHandler<GetDahitiReadingsQuery, GetDahitiReadingsResult>
{
    public async Task<GetDahitiReadingsResult> Handle(
        GetDahitiReadingsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var readings = await repository.GetReadingsAsync(
                request.DahitiId, Math.Clamp(request.Limit, 1, 10000), cancellationToken);
            return new GetDahitiReadingsResult(readings, DataInitialized: true);
        }
        catch (DahitiDataNotInitializedException)
        {
            return new GetDahitiReadingsResult(Readings: null, DataInitialized: false);
        }
    }
}

public sealed class GetDahitiAiInsightQueryHandler(
    IDahitiQueryRepository repository,
    IAiModelClient aiClient,
    ICurrentUser currentUser,
    ICorrelationContext correlationContext)
    : IQueryHandler<GetDahitiAiInsightQuery, DahitiAiInsightDto>
{
    public async Task<DahitiAiInsightDto> Handle(
        GetDahitiAiInsightQuery request,
        CancellationToken cancellationToken)
    {
        var insightType = request.InsightType.Trim().ToLowerInvariant();
        if (insightType is not ("forecast" or "anomaly" or "risk-score"))
        {
            throw new ArgumentException(
                "Supported insight types are forecast, anomaly, and risk-score.",
                nameof(request));
        }

        var stationId = $"DAHITI-{request.DahitiId}";
        var observations = DahitiAiDataQuality.KeepUsable(
            await repository.GetObservationsAsync(request.DahitiId, 5000, cancellationToken));

        if (observations.Count == 0)
        {
            return CreateResult(
                "NO_DATA",
                stationId,
                insightType,
                "NO_DATA",
                isFallback: false,
                new { status = "NO_DATA", details = "No DaHITI observations supplied" });
        }

        var response = await aiClient.GetInsightAsync(
            new AiInsightRequest(
                currentUser.OrganizationId ?? Guid.Empty,
                DahitiAiStationIdentity.FromDahitiId(request.DahitiId),
                insightType,
                null,
                Observations: observations),
            correlationContext.CorrelationId,
            cancellationToken);

        if (response is null)
        {
            return CreateResult(
                "AI_UNAVAILABLE",
                stationId,
                insightType,
                "NO_MODEL",
                isFallback: false,
                new { status = "AI_UNAVAILABLE" });
        }

        return new DahitiAiInsightDto(
            response.IsFallback ? "AI_UNAVAILABLE" : "READY",
            stationId,
            response.InsightType,
            response.ModelVersion,
            response.IsFallback,
            DateTimeOffset.UtcNow,
            JsonSerializer.Deserialize<JsonElement>(response.PayloadJson));
    }

    private static DahitiAiInsightDto CreateResult(
        string status,
        string stationId,
        string insightType,
        string modelVersion,
        bool isFallback,
        object payload)
    {
        return new DahitiAiInsightDto(
            status,
            stationId,
            insightType,
            modelVersion,
            isFallback,
            DateTimeOffset.UtcNow,
            JsonSerializer.SerializeToElement(payload));
    }
}

public sealed class GetDahitiAiAnomaliesQueryHandler(
    IDahitiQueryRepository repository,
    IAiModelClient aiClient,
    ICurrentUser currentUser,
    ICorrelationContext correlationContext)
    : IQueryHandler<GetDahitiAiAnomaliesQuery, IReadOnlyList<DahitiAiAnomalyDto>>
{
    public async Task<IReadOnlyList<DahitiAiAnomalyDto>> Handle(
        GetDahitiAiAnomaliesQuery request,
        CancellationToken cancellationToken)
    {
        var stations = await repository.GetStationsAsync(cancellationToken);
        var results = new List<DahitiAiAnomalyDto>();

        foreach (var station in stations)
        {
            if (!DahitiAiDataQuality.IsFresh(station.LastObservedAtUtc))
            {
                continue;
            }

            var observations = DahitiAiDataQuality.KeepUsable(
                await repository.GetObservationsAsync(station.DahitiId, 5000, cancellationToken));
            if (observations.Count == 0)
            {
                continue;
            }

            var response = await aiClient.GetInsightAsync(
                new AiInsightRequest(
                    currentUser.OrganizationId ?? Guid.Empty,
                    DahitiAiStationIdentity.FromDahitiId(station.DahitiId),
                    "anomaly",
                    null,
                    Observations: observations),
                correlationContext.CorrelationId,
                cancellationToken);
            if (response is null || response.IsFallback)
            {
                continue;
            }

            var payload = JsonSerializer.Deserialize<JsonElement>(response.PayloadJson);
            if (!payload.TryGetProperty("is_anomaly", out var anomaly)
                || anomaly.GetInt32() != 1)
            {
                continue;
            }

            var reasonCode = payload.TryGetProperty("anomaly_category", out var category)
                ? category.GetString() ?? "ANOMALY"
                : "ANOMALY";
            var score = payload.TryGetProperty("confidence_score", out var confidence)
                ? confidence.GetDouble()
                : 0d;
            results.Add(new DahitiAiAnomalyDto(
                station.StationId,
                station.Name,
                reasonCode,
                score,
                station.LastObservedAtUtc ?? station.LastSyncedAtUtc ?? DateTimeOffset.UtcNow));
        }

        return results;
    }
}
