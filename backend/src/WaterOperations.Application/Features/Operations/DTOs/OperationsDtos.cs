

namespace WaterOperations.Application.Features.Operations.DTOs;

public sealed record OperationsOverviewDto(
    DateTime AsOf,
    int StationCount,
    int OnlineCount,
    int OfflineCount,
    int OpenAlarmCount,
    IReadOnlyList<LatestTelemetryDto> LatestTelemetry);

public sealed record LatestTelemetryDto(
    Guid StationId,
    int ParameterId,
    DateTime TimestampUtc,
    decimal? Value,
    string CanonicalUnit,
    string QualityFlag);

public sealed record DataQualityDto(
    Guid StationId,
    DateTime WindowStartUtc,
    DateTime WindowEndUtc,
    int TotalCount,
    int ValidCount,
    int InterpolatedCount,
    int QuarantinedCount,
    int DuplicateCount,
    decimal ValidPct,
    decimal InterpolatedPct,
    decimal QuarantinedPct,
    int SchemaDriftEvents,
    string RulesetVersion);
