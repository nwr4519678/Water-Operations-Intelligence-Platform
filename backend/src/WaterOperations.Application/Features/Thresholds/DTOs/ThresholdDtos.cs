namespace WaterOperations.Application.Features.Thresholds.DTOs;

public sealed record ThresholdDto(
    long ThresholdId,
    Guid StationId,
    int ParameterId,
    decimal? WarningLow,
    decimal? WarningHigh,
    decimal? CriticalLow,
    decimal? CriticalHigh,
    DateTime EffectiveFromUtc,
    DateTime? EffectiveToUtc,
    bool IsActive);

public sealed record CreateThresholdRequest(
    Guid StationId,
    int ParameterId,
    decimal? WarningLow,
    decimal? WarningHigh,
    decimal? CriticalLow,
    decimal? CriticalHigh,
    DateTime EffectiveFromUtc,
    DateTime? EffectiveToUtc);

public sealed record UpdateThresholdRequest(
    decimal? WarningLow,
    decimal? WarningHigh,
    decimal? CriticalLow,
    decimal? CriticalHigh,
    DateTime EffectiveFromUtc,
    DateTime? EffectiveToUtc);
