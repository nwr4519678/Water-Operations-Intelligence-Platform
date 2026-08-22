namespace WaterOperations.Application.Features.Telemetry.DTOs;

public sealed record TelemetryQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    Guid? StationId,
    int? ParameterId,
    int? Limit);
public sealed record TelemetryPoint(
    string Id,
    Guid StationId,
    int ParameterId,
    DateTime TimestampUtc,
    decimal? Value,
    string Unit,
    string QualityFlag,
    bool IsInterpolated);

public sealed record ChartQuery(
    Guid StationId,
    int[] ParameterIds,
    DateTimeOffset From,
    DateTimeOffset To,
    int Limit);

public sealed record ChartPoint(
    long MeasurementCleanId,
    int ParameterId,
    DateTime TimestampUtc,
    decimal? Value,
    string Unit,
    string QualityFlag,
    bool IsInterpolated);
