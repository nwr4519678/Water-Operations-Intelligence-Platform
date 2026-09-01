using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Dahiti.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/dahiti")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class DahitiController(ISender sender) : ControllerBase
{
    [HttpGet("stations")]
    public async Task<IActionResult> Stations(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDahitiStationsQuery(), cancellationToken);
        return result.DataInitialized
            ? Ok(result.Stations)
            : Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "DaHITI data is not initialized.");
    }

    [HttpGet("trends/{dahitiId:int}")]
    public async Task<IActionResult> MonthlyTrend(
        int dahitiId,
        [FromQuery] int months = 12,
        CancellationToken cancellationToken = default)
    {
        months = Math.Clamp(months, 1, 24);
        var result = await sender.Send(new GetDahitiMonthlyTrendQuery(dahitiId, months), cancellationToken);
        return result.DataInitialized
            ? Ok(result.Trend)
            : Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "DaHITI data is not initialized.");
    }
}
