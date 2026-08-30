using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Notifications.Commands;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Application.Features.Notifications.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] bool unreadOnly,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNotificationsQuery(unreadOnly, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUnreadNotificationCountQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("{notificationId:long}/read")]
    public async Task<IActionResult> MarkRead(
        long notificationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new MarkNotificationReadCommand(notificationId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("preferences")]
    public async Task<IActionResult> Preferences(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNotificationPreferencesQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> SavePreference(
        [FromBody] NotificationPreferenceDto preference,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SaveNotificationPreferenceCommand(preference), cancellationToken);
        return result.ToActionResult(this);
    }
}
