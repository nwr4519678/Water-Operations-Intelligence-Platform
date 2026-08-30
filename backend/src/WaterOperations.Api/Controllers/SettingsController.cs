using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Notifications.Commands;
using WaterOperations.Application.Features.Notifications.Queries;
using WaterOperations.Application.Features.Settings.Commands;
using WaterOperations.Application.Features.Settings.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize]
public sealed class SettingsController(ISender sender) : ControllerBase
{
    [HttpGet("dashboard-layouts")]
    public async Task<IActionResult> Layouts(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetLayoutsQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("dashboard-layouts")]
    public async Task<IActionResult> SaveLayout(
        [FromBody] SaveDashboardLayoutCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("me")]
    public async Task<IActionResult> Preferences(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUserPreferencesQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdatePreferences(
        [FromBody] UpdateUserPreferencesCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("notification-preferences")]
    public async Task<IActionResult> NotificationPreferences(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNotificationPreferencesQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("notification-preferences")]
    public async Task<IActionResult> SaveNotificationPreference(
        [FromBody] SaveNotificationPreferenceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }
}
