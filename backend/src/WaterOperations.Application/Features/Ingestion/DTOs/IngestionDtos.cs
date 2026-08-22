namespace WaterOperations.Application.Features.Ingestion.DTOs;

public sealed record ReadingDto(
    Guid StationId,
    int ParameterId,
    DateTimeOffset TimestampUtc,
    decimal? Value,
    string Unit,
    long? DeviceSequence,
    string? PayloadJson);

public sealed record BatchRequestDto(
    Guid? BatchId,
    string SourceType,
    string? SourceName,
    string? SchemaVersion,
    IReadOnlyList<ReadingDto> Readings);

public sealed record IngestionResult(
    Guid BatchId,
    string Status,
    int TotalRows,
    int AcceptedRows,
    int RejectedRows,
    bool Duplicate);

public sealed record IngestionDuplicateResponse(Guid BatchId, string Status);

public sealed record BatchDetails(
    Guid IngestionBatchId,
    string SourceType,
    string? SourceName,
    string? SchemaVersion,
    DateTime StartedAtUtc,
    DateTime? CompletedAtUtc,
    int TotalRows,
    int AcceptedRows,
    int RejectedRows,
    string Status,
    string? ErrorMessage);
