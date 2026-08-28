using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Alarms.Commands;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/alarms")]
[Authorize(Roles = "OPERATOR,ADMIN")]
[Produces("application/json")]
public sealed class AlarmsController(ISender sender) : ControllerBase
{
    [HttpPatch("{alarmId:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(
        Guid alarmId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AcknowledgeAlarmCommand(alarmId), cancellationToken);
        return result.ToActionResult(this);
    }

    public sealed record ResolveAlarmBody(string? ResolutionNote);

    [HttpPatch("{alarmId:guid}/resolve")]
    public async Task<IActionResult> Resolve(
        Guid alarmId,
        [FromBody] ResolveAlarmBody? body,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ResolveAlarmCommand(alarmId, body?.ResolutionNote), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPatch("{alarmId:guid}/reopen")]
    public async Task<IActionResult> Reopen(
        Guid alarmId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ReopenAlarmCommand(alarmId), cancellationToken);
        return result.ToActionResult(this);
    }

    public sealed record TagLabelBody(string Label, decimal Confidence);

    [HttpPost("{alarmId:guid}/labels")]
    public async Task<IActionResult> TagLabel(
        Guid alarmId,
        [FromBody] TagLabelBody body,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new TagAlarmLabelCommand(alarmId, body.Label, body.Confidence), cancellationToken);
        return result.ToActionResult(this);
    }
}
