using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Retention.Commands;
using WaterOperations.Application.Features.Retention.DTOs;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/governance/retention")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class RetentionController(
    ISender sender)
    : ControllerBase
{
    [HttpGet("dry-run")]
    public async Task<IActionResult> DryRun(
        [FromQuery] int olderThanDays = 365,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new DryRunRetentionCommand(olderThanDays),
            cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute(
        PurgeRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ExecuteRetentionCommand(request),
            cancellationToken);
        return result.ToActionResult(this);
    }
}
