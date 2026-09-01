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
