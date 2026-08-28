using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Charts.Commands;
using WaterOperations.Application.Features.Charts.DTOs;
using WaterOperations.Application.Features.Charts.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public sealed class ChartAnnotationsController(ISender sender) : ControllerBase
{
    [HttpGet("stations/{stationId:guid}/annotations")]
    public async Task<IActionResult> GetByStation(
        Guid stationId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetChartAnnotationsQuery(stationId, from, to), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("stations/{stationId:guid}/annotations")]
    [Authorize(Roles = "OPERATOR,ADMIN")]
    public async Task<IActionResult> Create(
        Guid stationId,
        [FromBody] CreateChartAnnotationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateChartAnnotationCommand(stationId, request), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpDelete("annotations/{annotationId:long}")]
    [Authorize(Roles = "OPERATOR,ADMIN")]
    public async Task<IActionResult> Delete(
        long annotationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteChartAnnotationCommand(annotationId), cancellationToken);
        return result.ToActionResult(this);
    }
}
