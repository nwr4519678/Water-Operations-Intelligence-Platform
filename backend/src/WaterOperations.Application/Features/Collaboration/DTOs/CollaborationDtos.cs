namespace WaterOperations.Application.Features.Collaboration.DTOs;

/// <summary>
/// Collaboration note associated with an operational station.
/// </summary>
public sealed record CollaborationNoteDto(
    long NoteId,
    Guid StationId,
    Guid AuthorUserId,
    string NoteText,
    bool IsResolved,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

/// <summary>
/// Request payload for creating a new collaboration note.
/// </summary>
public sealed record AddCollaborationNoteRequest(
    Guid StationId,
    long? ParentNoteId,
    string NoteText);

/// <summary>
/// Metadata for a shared station data snapshot link.
/// </summary>
public sealed record SharedSnapshotDto(
    Guid SnapshotId,
    Guid? StationId,
    DateTime ExpiresAtUtc,
    DateTime CreatedAtUtc,
    string Token);

/// <summary>
/// Full content payload of a shared station snapshot.
/// </summary>
public sealed record SharedSnapshotContentDto(
    Guid SnapshotId,
    Guid? StationId,
    string SnapshotJson,
    DateTime ExpiresAtUtc,
    DateTime CreatedAtUtc);
