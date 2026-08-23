using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Telemetry.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/charts")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class ChartsController(
    ISender sender)
    : ControllerBase
{
    [HttpGet("measurements")]
    public async Task<IActionResult> Measurements(
        [FromQuery] Guid stationId,
        [FromQuery] int[] parameterId,
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] int limit = 5000,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetChartQuery(stationId, parameterId, from, to, limit),
            cancellationToken);
        return result.ToActionResult(this);
    }
}
