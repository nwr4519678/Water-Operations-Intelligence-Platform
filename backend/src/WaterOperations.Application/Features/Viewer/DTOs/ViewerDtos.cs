namespace WaterOperations.Application.Features.Viewer.DTOs;

public sealed record OrganizationDto(
    Guid Id,
    string Name);

public sealed record RegionDto(
    Guid Id,
    Guid OrganizationId,
    string Name);

public sealed record StationDto(
    Guid Id,
    Guid RegionId,
    string Name);

public sealed record MeasurementDto(
    long Id,
    Guid StationId,
    DateTimeOffset RecordedAt,
    decimal Value,
    string Unit);

public sealed record AlarmDto(
    Guid AlarmId,
    Guid StationId,
    string StationName,
    string StationCode,
    int AlarmTypeId,
    string AlarmTypeCode,
    string Severity,
    string Status,
    DateTimeOffset RaisedAtUtc,
    DateTimeOffset? AcknowledgedAtUtc,
    string? AcknowledgedByEmail,
    DateTimeOffset? ResolvedAtUtc,
    string? ResolvedByEmail,
    string Message,
    string? ResolutionNote,
    decimal? ValueAtRaise,
    decimal? ThresholdValue);
