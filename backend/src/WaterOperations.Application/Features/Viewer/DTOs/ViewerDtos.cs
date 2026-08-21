namespace WaterOperations.Application.Features.Viewer.DTOs;

public sealed record OrganizationDto(Guid Id, string Name);

public sealed record RegionDto(Guid Id, Guid OrganizationId, string Name);

public sealed record StationDto(Guid Id, Guid RegionId, string Name);

public sealed record MeasurementDto(long Id, Guid StationId, DateTimeOffset RecordedAt, decimal Value, string Unit);

public sealed record AlarmDto(Guid Id, Guid StationId, DateTimeOffset RaisedAt, string Severity, string Message);
