using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/settings"), Authorize]
public sealed class SettingsController(ISender sender) : ControllerBase
{
    [HttpGet("dashboard-layouts")]
    public async Task<IActionResult> Layouts(CancellationToken ct) => (await sender.Send(new GetLayoutsQuery(), ct)).ToActionResult(this);

    [HttpPut("dashboard-layouts")]
    public async Task<IActionResult> SaveLayout([FromBody] SaveDashboardLayoutCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpGet("me")]
    public async Task<IActionResult> Preferences(CancellationToken ct) => (await sender.Send(new GetUserPreferencesQuery(), ct)).ToActionResult(this);

    [HttpPut("me")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateUserPreferencesCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpGet("notification-preferences")]
    public async Task<IActionResult> NotificationPreferences(CancellationToken ct) => (await sender.Send(new GetNotificationPreferencesQuery(), ct)).ToActionResult(this);

    [HttpPut("notification-preferences")]
    public async Task<IActionResult> SaveNotificationPreference([FromBody] SaveNotificationPreferenceCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);
}
