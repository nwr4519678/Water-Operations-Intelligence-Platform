namespace WaterOperations.Application.Features.Administration.DTOs;

/// <summary>
/// User record details for administrative management.
/// </summary>
public sealed record UserAdminDto(
    Guid UserId,
    string Email,
    string DisplayName,
    string ClientType,
    bool IsActive,
    DateTime CreatedAtUtc);

/// <summary>
/// Region details for administrative configuration.
/// </summary>
public sealed record RegionAdminDto(
    Guid RegionId,
    Guid OrganizationId,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAtUtc);

/// <summary>
/// Role assignment details for a user.
/// </summary>
public sealed record UserRoleDto(
    Guid UserId,
    int RoleId,
    string Code,
    string DisplayName,
    DateTime AssignedAtUtc);

/// <summary>
/// Request contract for creating a new region.
/// </summary>
public sealed record CreateRegionRequest(
    string Code,
    string Name,
    string? Description,
    string? BoundaryJson);

/// <summary>
/// Request contract for updating an existing region.
/// </summary>
public sealed record UpdateRegionRequest(
    string Code,
    string Name,
    string? Description,
    string? BoundaryJson,
    bool IsActive);

/// <summary>
/// Request contract for assigning a role to a user.
/// </summary>
public sealed record AssignUserRoleRequest(
    int RoleId);

/// <summary>
/// Organization details and configuration settings.
/// </summary>
public sealed record OrganizationDto(
    Guid OrganizationId,
    string Name,
    string Slug,
    string? LogoUrl,
    string DefaultLocale,
    string DefaultTimeZone,
    bool IsActive);

/// <summary>
/// Saved dashboard layout preferences.
/// </summary>
public sealed record DashboardLayoutDto(
    long Id,
    string LayoutName,
    string WidgetsJson,
    bool IsDefault,
    DateTime UpdatedAtUtc);

/// <summary>
/// Request contract for changing user activation state.
/// </summary>
public sealed record SetUserActiveRequest(
    bool IsActive);

/// <summary>
/// User UI and locale preferences.
/// </summary>
public sealed record UserPreferencesDto(
    string Theme,
    string Locale,
    string TimeZone,
    byte DecimalPrecision);

public sealed record CreateStationRequest(
    string StationCode,
    string Name,
    string? Description,
    Guid? RegionId,
    decimal? Latitude,
    decimal? Longitude,
    decimal? ElevationMeters,
    decimal? StaffGaugeHeight,
    int? CommunicationIntervalSeconds,
    string? MetadataJson);

public sealed record UpdateStationRequest(
    string StationCode,
    string Name,
    string? Description,
    Guid? RegionId,
    decimal? Latitude,
    decimal? Longitude,
    decimal? ElevationMeters,
    decimal? StaffGaugeHeight,
    int? CommunicationIntervalSeconds,
    string? MetadataJson,
    bool IsActive);

public sealed record AssignStationParametersRequest(
    IReadOnlyList<int> ParameterIds);

public sealed record CreateStationConnectionRequest(
    Guid DownstreamStationId,
    string ConnectionType);
