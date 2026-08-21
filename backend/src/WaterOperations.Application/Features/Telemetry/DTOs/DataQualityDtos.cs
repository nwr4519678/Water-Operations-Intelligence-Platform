namespace WaterOperations.Application.Features.Telemetry.DTOs;

public sealed record DataQualityDto(Guid OrganizationId, Guid StationId, string StationCode, string StationName, DateTime WindowStartUtc, DateTime WindowEndUtc, int TotalCount, int ValidCount, int InterpolatedCount, int QuarantinedCount, int DuplicateCount, decimal ValidPct, decimal InterpolatedPct, decimal QuarantinedPct, int SchemaDriftEvents, string? RulesetVersion);
