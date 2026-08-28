using System.Text.Json;

namespace WaterOperations.Application.Features.AI.DTOs;

/// <summary>
/// Data transfer object for AI anomaly detection findings.
/// </summary>
public sealed record AnomalyDto(
    long Id,
    Guid StationId,
    string ReasonCode,
    decimal Score,
    DateTime DetectedAtUtc,
    bool IsReviewed);

/// <summary>
/// Data transfer object representing an AI model in the registry.
/// </summary>
public sealed record ModelDto(
    Guid ModelId,
    string ModelType,
    string Version,
    string Status,
    DateTime? PromotedAtUtc);

/// <summary>
/// Result returned when performing mutations (promote, retrain, retire) on an AI model.
/// </summary>
public sealed record ModelMutationResult(
    bool Succeeded,
    string? ErrorCode);

/// <summary>
/// Request contract for AI resource operations.
/// </summary>
public sealed record AiResourceRequest(
    Guid ResourceId);

/// <summary>
/// Input parameters for requesting an AI insight.
/// </summary>
public sealed record AiInsightRequest(
    Guid OrganizationId,
    Guid StationId,
    string InsightType,
    DateTimeOffset? AsOfUtc,
    int? ParameterId = null,
    IReadOnlyList<AiTelemetryObservation>? Observations = null);

public sealed record AiTelemetryObservation(
    DateTimeOffset TimestampUtc,
    double Value,
    double? UncertaintyMeters = null);

/// <summary>
/// Response returned from an AI model service.
/// </summary>
public sealed record AiInsightResponse(
    string ModelVersion,
    string InsightType,
    string PayloadJson,
    bool IsFallback = false);

/// <summary>
/// Result wrapper for an AI insight query execution.
/// </summary>
public sealed record AiInsightResult(
    string Status,
    AiInsightResponse? Response,
    Guid? StationId = null)
{
    public string? InsightType => Response?.InsightType;
    public string? ModelVersion => Response?.ModelVersion;
    public bool IsFallback => Response?.IsFallback ?? true;
    public DateTimeOffset GeneratedAtUtc { get; } = DateTimeOffset.UtcNow;
    public JsonElement? Payload => Response is null
        ? null
        : JsonSerializer.Deserialize<JsonElement>(Response.PayloadJson);
}
