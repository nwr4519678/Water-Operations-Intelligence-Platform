namespace WaterOperations.Application.Features.Operations.DTOs;

public sealed record ThresholdDto(long ThresholdId, Guid StationId, int ParameterId, decimal? WarningLow, decimal? WarningHigh, decimal? CriticalLow, decimal? CriticalHigh, DateTime EffectiveFromUtc, DateTime? EffectiveToUtc, bool IsActive);
public sealed record ThresholdRequest(Guid StationId, int ParameterId, decimal? WarningLow, decimal? WarningHigh, decimal? CriticalLow, decimal? CriticalHigh, DateTime EffectiveFromUtc, DateTime? EffectiveToUtc, bool IsActive = true);
