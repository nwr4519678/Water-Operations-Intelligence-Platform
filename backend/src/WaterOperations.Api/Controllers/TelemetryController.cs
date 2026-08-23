using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Telemetry.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryController(ISender sender) : ControllerBase
{
    [HttpGet("telemetry")]
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

        return result.ToActionResult(this);
    }

    [HttpGet("charts/measurements")]
    public async Task<IActionResult> ChartMeasurements(
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
