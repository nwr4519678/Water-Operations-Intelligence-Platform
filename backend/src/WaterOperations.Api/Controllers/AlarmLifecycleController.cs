using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/alarms"), Authorize(Policy = AuthorizationPolicies.OperatorOnly)]
public sealed class AlarmLifecycleController(IAlarmLifecycleService alarms) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken cancellationToken) => Ok(await alarms.ListAsync(status, cancellationToken));

    [HttpPost("{alarmId:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid alarmId, [FromBody] MutationRequest? request, CancellationToken cancellationToken) =>
        await Mutate(alarms.AcknowledgeAsync(alarmId, request?.Note, cancellationToken));

    [HttpPost("{alarmId:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid alarmId, [FromBody] MutationRequest? request, CancellationToken cancellationToken) =>
        await Mutate(alarms.ResolveAsync(alarmId, request?.Note, cancellationToken));

    private static async Task<IActionResult> Mutate(Task<Application.Features.Operations.DTOs.AlarmMutationResult?> result)
    {
        var value = await result;
        return value is null ? new NotFoundResult() : new OkObjectResult(value);
    }
    public sealed record MutationRequest(string? Note);
}
