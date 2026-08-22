namespace WaterOperations.Application.Features.Stations.DTOs;

public sealed record StationSearchRequest(
    string? Search,
    Guid? RegionId,
    string? Status,
    int Page = 1,
    int PageSize = 50,
    decimal? MinLatitude = null,
    decimal? MinLongitude = null,
    decimal? MaxLatitude = null,
    decimal? MaxLongitude = null);

public sealed record StationListItemDto(
    Guid StationId,
    Guid OrganizationId,
    Guid? RegionId,
    string StationCode,
    string Name,
    decimal? Latitude,
    decimal? Longitude,
    string Status,
    DateTime? LastSeenAtUtc,
    bool IsActive);

public sealed record StationParameterDto(
    int ParameterId,
    string SourceUnit);

public sealed record StationDetailsDto(
    Guid StationId,
    Guid OrganizationId,
    Guid? RegionId,
    string StationCode,
    string Name,
    string? Description,
    decimal? Latitude,
    decimal? Longitude,
    decimal? ElevationMeters,
    string Status,
    DateTime? LastSeenAtUtc,
    bool IsActive,
    IReadOnlyList<StationParameterDto> Parameters);
