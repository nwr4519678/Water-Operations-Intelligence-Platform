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
    [AllowAnonymous]
    [HttpGet("stations")]
    public async Task<IActionResult> Stations(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDahitiStationsQuery(), cancellationToken);
        return result.DataInitialized
            ? Ok(result.Stations)
            : Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "DaHITI data is not initialized.");
    }

    [AllowAnonymous]
    [HttpGet("trends/{dahitiId:int}")]
    public async Task<IActionResult> MonthlyTrend(
        int dahitiId,
        [FromQuery] int months = 12,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetDahitiMonthlyTrendQuery(dahitiId, months), cancellationToken);
        return result.DataInitialized
            ? Ok(result.Trend)
            : Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "DaHITI data is not initialized.");
    }

    [AllowAnonymous]
    [HttpGet("readings/{dahitiId:int}")]
    public async Task<IActionResult> Readings(
        int dahitiId,
        [FromQuery] int limit = 10000,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetDahitiReadingsQuery(dahitiId, limit), cancellationToken);
        return result.DataInitialized
            ? Ok(result.Readings)
            : Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "DaHITI data is not initialized.");
    }

    [HttpGet("{dahitiId:int}/ai")]
    public async Task<IActionResult> Ai(
        int dahitiId,
        [FromQuery] string insightType = "forecast",
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetDahitiAiInsightQuery(dahitiId, insightType),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("ai/anomalies")]
    public async Task<IActionResult> AiAnomalies(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDahitiAiAnomaliesQuery(), cancellationToken);
        return Ok(result);
    }
}
