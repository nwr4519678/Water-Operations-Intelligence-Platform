


namespace WaterOperations.Application.Features.Retention.DTOs;

public sealed record PurgeRequestDto(
    int OlderThanDays,
    bool Approved);

public sealed record RetentionDryRun(
    Guid OrganizationId,
    DateTime Cutoff,
    int RawRows,
    int CleanRows,
    bool RequiresApproval);

public sealed record RetentionResult(
    Guid OrganizationId,
    int RawRowsDeleted,
    int CleanRowsDeleted,
    DateTime Cutoff);
