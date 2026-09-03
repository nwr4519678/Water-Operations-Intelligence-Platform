using System.Text.Json;

namespace WaterOperations.Application.Features.Dahiti.DTOs;

public sealed record DahitiStationDto(
    string StationId,
    int DahitiId,
    string Name,
    string Country,
    string Continent,
    double Latitude,
    double Longitude,
    DateTimeOffset? LastSyncedAtUtc,
    DateTimeOffset? LastObservedAtUtc,
    double? WaterLevel,
    double? Uncertainty,
    int ObservationCount);

public sealed record DahitiMonthlyTrendDto(
    DateTime Month,
    double AverageLevel,
    double MinimumLevel,
    double MaximumLevel,
    long ObservationCount);

public sealed record DahitiReadingDto(
    DateTimeOffset ObservedAtUtc,
    double WaterLevel,
    double? Uncertainty);

public sealed record DahitiAiInsightDto(
    string Status,
    string StationId,
    string InsightType,
    string ModelVersion,
    bool IsFallback,
    DateTimeOffset GeneratedAtUtc,
    JsonElement Payload);

public sealed record DahitiAiAnomalyDto(
    string StationId,
    string StationName,
    string ReasonCode,
    double Score,
    DateTimeOffset DetectedAtUtc);
