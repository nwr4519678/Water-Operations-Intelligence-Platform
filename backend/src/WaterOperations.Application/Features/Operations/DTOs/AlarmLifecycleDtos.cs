namespace WaterOperations.Application.Features.Operations.DTOs;

public sealed record AlarmSummaryDto(Guid AlarmId, Guid StationId, string Severity, string Status, string Message, DateTime RaisedAtUtc);
public sealed record AlarmMutationResult(Guid AlarmId, string Status, DateTime ChangedAtUtc);
