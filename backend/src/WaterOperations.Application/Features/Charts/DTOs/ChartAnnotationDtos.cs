namespace WaterOperations.Application.Features.Charts.DTOs;

public sealed record ChartAnnotationDto(
    long ChartAnnotationId,
    Guid StationId,
    int? ParameterId,
    Guid UserId,
    DateTime TimestampUtc,
    string Text,
    DateTime CreatedAtUtc);

public sealed record CreateChartAnnotationRequest(
    int? ParameterId,
    DateTime TimestampUtc,
    string Text);
