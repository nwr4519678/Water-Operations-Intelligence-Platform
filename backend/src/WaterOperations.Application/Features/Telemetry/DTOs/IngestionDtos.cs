namespace WaterOperations.Application.Features.Telemetry.DTOs;

public sealed record IngestionRowRequest(Guid StationId, int ParameterId, DateTime TimestampUtc, decimal? Value, string? Unit, long? DeviceSequence, string? PayloadJson);
public sealed record IngestionBatchRequest(Guid BatchId, string SourceType, string SourceName, string SchemaVersion, IReadOnlyList<IngestionRowRequest> Rows);
public sealed record IngestionBatchResult(Guid BatchId, int AcceptedRows, int DuplicateRows, int RejectedRows);
