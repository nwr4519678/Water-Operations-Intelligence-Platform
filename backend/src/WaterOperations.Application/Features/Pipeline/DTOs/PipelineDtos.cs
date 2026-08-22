namespace WaterOperations.Application.Features.Pipeline.DTOs;

public sealed record CleanRowDto(
    long SourceRawId,
    Guid StationId,
    int ParameterId,
    DateTimeOffset TimestampUtc,
    decimal? Value,
    string Unit,
    string QualityFlag,
    string? QuarantineReason,
    bool IsInterpolated);

public sealed record CleanBatchRequestDto(
    string RulesetVersion,
    IReadOnlyList<CleanRowDto> Rows);

public sealed record CleanBatchResult(
    Guid BatchId,
    int AcceptedRows,
    int RejectedRows,
    string RulesetVersion);
