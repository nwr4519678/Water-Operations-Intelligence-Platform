namespace WaterOperations.Application.Features.Audit.DTOs;

/// <summary>
/// Data transfer object for audit trail log entries.
/// </summary>
public sealed record AuditEntryDto(
    long AuditLogId,
    string ActionCode,
    string? EntityType,
    string? EntityId,
    bool Success,
    DateTime OccurredAtUtc,
    Guid? ActorUserId,
    string? RequestId,
    string? BeforeJson,
    string? AfterJson);

/// <summary>
/// Query filter criteria for retrieving audit log entries.
/// </summary>
public sealed record AuditFilter(
    DateTime? FromUtc,
    DateTime? ToUtc,
    Guid? ActorUserId,
    string? ActionCode,
    string? EntityType,
    string? EntityId);
