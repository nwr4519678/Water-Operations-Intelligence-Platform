namespace WaterOperations.Application.Features.Viewer.DTOs;

public sealed record OrganizationDto(Guid Id, string Name);

public sealed record RegionDto(Guid Id, Guid OrganizationId, string Name);

public sealed record StationDto(Guid Id, Guid RegionId, string Name);
public sealed record StationSearchDto(Guid Id, Guid? RegionId, string Code, string Name, string Status, decimal? Latitude, decimal? Longitude, DateTime? LastSeenAtUtc, bool IsActive);
public sealed record StationDetailDto(Guid Id, Guid OrganizationId, Guid? RegionId, string Code, string Name, string? Description, decimal? Latitude, decimal? Longitude, decimal? ElevationMeters, string Status, DateTime? LastSeenAtUtc, bool IsActive, IReadOnlyList<StationParameterDto> Parameters, IReadOnlyList<StationConnectionDto> Connections, IReadOnlyList<StationLinkDto> Links);
public sealed record StationParameterDto(int ParameterId, string Code, string Name, string Unit, bool IsEnabled);
public sealed record StationConnectionDto(long Id, string Protocol, string DeviceIdentifier, string? FirmwareVersion, decimal? SignalStrength, decimal? BatteryVoltage, bool IsPrimary, bool IsActive, DateTime? LastConnectedAtUtc);
public sealed record StationLinkDto(long Id, Guid FromStationId, Guid ToStationId, string LinkType, decimal? DistanceMeters, string? FlowDirection, bool IsActive);
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
public sealed record ChartMeasurementDto(long Id, Guid StationId, int ParameterId, DateTimeOffset RecordedAt, decimal Value, string Unit, string QualityFlag, bool IsInterpolated);

public sealed record MeasurementDto(long Id, Guid StationId, DateTimeOffset RecordedAt, decimal Value, string Unit);

public sealed record AlarmDto(Guid Id, Guid StationId, DateTimeOffset RaisedAt, string Severity, string Message);
