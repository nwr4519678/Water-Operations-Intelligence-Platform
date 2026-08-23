using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.AI.Commands;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Queries;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Operations.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class AiController(ISender sender) : ControllerBase
{
    [HttpGet("ai/anomalies")]
    public async Task<IActionResult> Anomalies(
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnomaliesQuery(pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/models")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Models(
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetModelsQuery(pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("ai/models/{modelId:guid}/retrain")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Retrain(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RetrainModelCommand(modelId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("ai/models/{modelId:guid}/promote")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Promote(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new PromoteModelCommand(modelId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("ai/models/{modelId:guid}/retire")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Retire(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RetireModelCommand(modelId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/insights/{stationId:guid}")]
    public async Task<IActionResult> Insight(
        Guid stationId,
        [FromQuery] string insightType,
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(stationId, insightType, asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/forecast/{stationId:guid}")]
    public async Task<IActionResult> Forecast(
        Guid stationId,
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(stationId, "forecast", asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/maintenance/predictions")]
    public async Task<IActionResult> Maintenance(
        [FromQuery] Guid? stationId,
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(stationId, "maintenance", asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/stations/clusters")]
    public async Task<IActionResult> Clusters(
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(null, "clusters", asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("ai/alarms/triage")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Triage(
        [FromBody] AiResourceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(request.ResourceId, "alarm-triage", null), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/reports/{reportId:guid}/summary")]
    public async Task<IActionResult> ReportSummary(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(reportId, "report-summary", null), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/focus-stations")]
    public async Task<IActionResult> FocusStations(
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(null, "focus-stations", asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/alarms/{alarmId:guid}/fault-probability")]
    public async Task<IActionResult> FaultProbability(
        Guid alarmId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(alarmId, "fault-probability", null), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/risk-score")]
    public async Task<IActionResult> RiskScore(
        [FromQuery] Guid? stationId,
        [FromQuery] DateTimeOffset? asOfUtc,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAiInsightQuery(stationId, "risk-score", asOfUtc), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("ai/data/bulk-import")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BulkImport(
        [FromBody] BatchRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new IngestBatchCommand(request), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/data/bulk-import/{batchId:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BulkImportStatus(
        Guid batchId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetBatchQuery(batchId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("ai/data/quality")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DataQuality(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDataQualityQuery(from, to, pagination), cancellationToken);
        return result.ToActionResult(this);
    }
}
