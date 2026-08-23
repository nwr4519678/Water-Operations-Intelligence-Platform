using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/notifications"), Authorize]
public sealed class NotificationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool unreadOnly, [FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new GetNotificationsQuery(unreadOnly, pagination), ct)).ToActionResult(this);

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct) => (await sender.Send(new GetUnreadNotificationCountQuery(), ct)).ToActionResult(this);

    [HttpPost("{notificationId:long}/read")]
    public async Task<IActionResult> MarkRead(long notificationId, CancellationToken ct) => (await sender.Send(new MarkNotificationReadCommand(notificationId), ct)).ToActionResult(this);
}
