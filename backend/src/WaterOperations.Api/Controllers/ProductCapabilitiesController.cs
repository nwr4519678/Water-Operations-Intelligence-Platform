using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

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
    public async Task<IActionResult> Models([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetModelsQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetReportsQuery(pagination), cancellationToken)).ToActionResult(this);

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
    public async Task<IActionResult> Audit([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetAuditQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("admin/users")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Users([FromQuery] PaginationRequest pagination, CancellationToken cancellationToken) =>
        (await sender.Send(new GetUsersQuery(pagination), cancellationToken)).ToActionResult(this);

    [HttpGet("admin/organization")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Organization(CancellationToken cancellationToken) =>
        (await sender.Send(new GetOrganizationQuery(), cancellationToken)).ToActionResult(this);

    [HttpGet("settings/dashboard-layouts")]
    public async Task<IActionResult> Layouts(CancellationToken cancellationToken) =>
        (await sender.Send(new GetLayoutsQuery(), cancellationToken)).ToActionResult(this);

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
        (await sender.Send(new AddCollaborationNoteCommand(stationId, request.NoteText), cancellationToken)).ToActionResult(this);

    [HttpPost("sharing/snapshots")]
    public async Task<IActionResult> CreateSnapshot([FromBody] CreateShareSnapshotCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);

    [HttpPost("reports/schedules")]
    public async Task<IActionResult> CreateReportSchedule([FromBody] CreateReportScheduleCommand command, CancellationToken cancellationToken) =>
        (await sender.Send(command, cancellationToken)).ToActionResult(this);
}
