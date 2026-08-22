using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.AI;
using WaterOperations.Application.Features.ProductCapabilities.Queries;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Operations.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public sealed class ProductCapabilitiesController(ISender sender) : ControllerBase
{
    [HttpGet("ai/anomalies")]
    public async Task<IActionResult> Anomalies([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAnomaliesQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/models")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Models([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetModelsQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpPost("ai/models/{modelId:guid}/retrain")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Retrain(Guid modelId, CancellationToken cancellationToken) =>
        (await sender.Send(new RetrainModelCommand(modelId), cancellationToken)).ToActionResult(this);

    [HttpPost("ai/models/{modelId:guid}/promote")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Promote(Guid modelId, CancellationToken cancellationToken) =>
        (await sender.Send(new PromoteModelCommand(modelId), cancellationToken)).ToActionResult(this);

    [HttpPost("ai/models/{modelId:guid}/retire")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Retire(Guid modelId, CancellationToken cancellationToken) =>
        (await sender.Send(new RetireModelCommand(modelId), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/insights/{stationId:guid}")]
    public async Task<IActionResult> Insight(Guid stationId, [FromQuery] string insightType, [FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(stationId, insightType, asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/forecast/{stationId:guid}")]
    public async Task<IActionResult> Forecast(Guid stationId, [FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(stationId, "forecast", asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/maintenance/predictions")]
    public async Task<IActionResult> Maintenance([FromQuery] Guid? stationId, [FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(stationId, "maintenance", asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/stations/clusters")]
    public async Task<IActionResult> Clusters([FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(null, "clusters", asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpPost("ai/alarms/triage")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Triage([FromBody] AiResourceRequest request, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(request.ResourceId, "alarm-triage", null), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/reports/{reportId:guid}/summary")]
    public async Task<IActionResult> ReportSummary(Guid reportId, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(reportId, "report-summary", null), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/focus-stations")]
    public async Task<IActionResult> FocusStations([FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(null, "focus-stations", asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/alarms/{alarmId:guid}/fault-probability")]
    public async Task<IActionResult> FaultProbability(Guid alarmId, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(alarmId, "fault-probability", null), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/risk-score")]
    public async Task<IActionResult> RiskScore([FromQuery] Guid? stationId, [FromQuery] DateTimeOffset? asOfUtc, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAiInsightQuery(stationId, "risk-score", asOfUtc), cancellationToken)).ToActionResult(this);

    [HttpPost("ai/data/bulk-import")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BulkImport([FromBody] BatchRequestDto request, CancellationToken cancellationToken) =>
        (await sender.Send(new IngestBatchCommand(request), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/data/bulk-import/{batchId:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BulkImportStatus(Guid batchId, CancellationToken cancellationToken) =>
        (await sender.Send(new GetBatchQuery(batchId), cancellationToken)).ToActionResult(this);

    [HttpGet("ai/data/quality")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AiDataQuality(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken) =>
        (await sender.Send(new GetDataQualityQuery(from, to, pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] ReportFilter filter, [FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetReportsQuery(filter, pagination), cancellationToken)).ToActionResult(this);

    [HttpPost("reports")]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpGet("reports/{reportId:guid}")]
    public async Task<IActionResult> Report(Guid reportId, CancellationToken cancellationToken) =>
        (await sender.Send(new GetReportQuery(reportId), cancellationToken)).ToActionResult(this);

    [HttpGet("reports/{reportId:guid}/download")]
    public async Task<IActionResult> DownloadReport(Guid reportId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DownloadReportQuery(reportId), cancellationToken);
        return !result.IsAuthorized ? (result.IsNotFound ? NotFound() : Forbid()) : File(result.Value!.Content, result.Value.ContentType, result.Value.FileName);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications([FromQuery] bool unreadOnly, [FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetNotificationsQuery(unreadOnly, pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("notifications/unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken) =>
        (await sender.Send(new GetUnreadNotificationCountQuery(), cancellationToken)).ToActionResult(this);

    [HttpPost("notifications/{notificationId:long}/read")]
    public async Task<IActionResult> MarkRead(long notificationId, CancellationToken cancellationToken) =>
        (await sender.Send(new MarkNotificationReadCommand(notificationId), cancellationToken)).ToActionResult(this);

    [HttpGet("admin/audit")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Audit([FromQuery] AuditFilter filter, [FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAuditQuery(filter, pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("admin/audit/export")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ExportAudit([FromQuery] AuditFilter filter, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ExportAuditQuery(filter), cancellationToken);
        return result.IsAuthorized ? File(System.Text.Encoding.UTF8.GetBytes(result.Value!), "text/csv", "audit-log.csv") : Forbid();
    }

    [HttpGet("admin/users")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Users([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetUsersQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("admin/organization")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Organization(CancellationToken cancellationToken) =>
        (await sender.Send(new GetOrganizationQuery(), cancellationToken)).ToActionResult(this);

    [HttpPut("admin/organization")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateOrganization([FromBody] UpdateOrganizationCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpPatch("admin/users/{userId:guid}/active")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> SetUserActive(Guid userId, [FromBody] SetUserActiveRequest request, CancellationToken cancellationToken) =>
        (await sender.Send(new SetUserActiveCommand(userId, request.IsActive), cancellationToken)).ToActionResult(this);

    [HttpGet("settings/dashboard-layouts")]
    public async Task<IActionResult> Layouts(CancellationToken cancellationToken) =>
        (await sender.Send(new GetLayoutsQuery(), cancellationToken)).ToActionResult(this);

    [HttpGet("settings/me")]
    public async Task<IActionResult> Preferences(CancellationToken cancellationToken) =>
        (await sender.Send(new GetUserPreferencesQuery(), cancellationToken)).ToActionResult(this);

    [HttpPut("settings/me")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateUserPreferencesCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpGet("settings/notification-preferences")]
    public async Task<IActionResult> NotificationPreferences(CancellationToken cancellationToken) =>
        (await sender.Send(new GetNotificationPreferencesQuery(), cancellationToken)).ToActionResult(this);

    [HttpPut("settings/notification-preferences")]
    public async Task<IActionResult> SaveNotificationPreference([FromBody] SaveNotificationPreferenceCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpPut("settings/dashboard-layouts")]
    public async Task<IActionResult> SaveLayout([FromBody] SaveDashboardLayoutCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new SearchProductQuery(query, pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> Notes(Guid stationId, [FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetCollaborationNotesQuery(stationId, pagination), cancellationToken)).ToActionResult(this);

    [HttpPost("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> AddNote(Guid stationId, [FromBody] AddCollaborationNoteRequest request, CancellationToken cancellationToken) =>
        (await sender.Send(new AddCollaborationNoteCommand(stationId, request.ParentNoteId, request.NoteText), cancellationToken)).ToActionResult(this);

    [HttpPut("collaboration-notes/{noteId:long}")]
    public async Task<IActionResult> UpdateNote(long noteId, [FromBody] UpdateCollaborationNoteCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command with { NoteId = noteId }, cancellationToken)).ToActionResult(this);

    [HttpPost("sharing/snapshots")]
    public async Task<IActionResult> CreateSnapshot([FromBody] CreateShareSnapshotCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpGet("sharing/snapshots/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> SharedSnapshot(string token, CancellationToken cancellationToken) =>
        (await sender.Send(new GetSharedSnapshotQuery(token), cancellationToken)).ToActionResult(this);

    [HttpDelete("sharing/snapshots/{snapshotId:guid}")]
    public async Task<IActionResult> RevokeSnapshot(Guid snapshotId, CancellationToken cancellationToken) =>
        (await sender.Send(new RevokeShareSnapshotCommand(snapshotId), cancellationToken)).ToActionResult(this);

    [HttpPost("reports/schedules")]
    public async Task<IActionResult> CreateReportSchedule([FromBody] CreateReportScheduleCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpPatch("reports/schedules/{scheduleId:long}")]
    public async Task<IActionResult> SetReportScheduleActive(long scheduleId, [FromBody] SetReportScheduleActiveCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command with { ScheduleId = scheduleId }, cancellationToken)).ToActionResult(this);
}
