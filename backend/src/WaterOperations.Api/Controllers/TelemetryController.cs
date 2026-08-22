using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Telemetry.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/telemetry")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryController(
    ISender sender)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] Guid? stationId,
        [FromQuery] int? parameterId,
        [FromQuery] int? limit,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetTelemetryQuery(from, to, stationId, parameterId, limit),
            cancellationToken);
        return result.ToTelemetryResult(this);
}
    [HttpPost("start")]
    public IActionResult Start()
    {
        return Forbid();
    }
}
