namespace WaterOperations.Application.Features.Viewer.DTOs;

public sealed record OverviewDto(
    DateTimeOffset AsOfUtc,
    int TotalStations,
    int OnlineStations,
    int OfflineStations,
    int OpenAlarms,
    int MeasurementsInWindow,
    string ServiceStatus);
