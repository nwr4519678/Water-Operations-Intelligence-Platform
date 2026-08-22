namespace WaterOperations.Application.Features.Telemetry.DTOs;

public sealed record TelemetryResponse(
    IReadOnlyList<TelemetryItem> Data,
    int Limit,
    IReadOnlyList<TelemetryFixturePoint>? FixtureData = null);

public sealed record TelemetryItem(
    long Id,
    Guid StationId,
    int ParameterId,
    DateTime TimestampUtc,
    decimal? Value,
    string Unit,
    string QualityFlag,
    bool IsInterpolated);

public sealed record TelemetryFixturePoint(
    string Id,
    string Organization,
    string Region,
    double Value);

public sealed record ChartResponse(
    IReadOnlyList<ChartPoint> Data,
    bool Truncated,
    int Limit);
