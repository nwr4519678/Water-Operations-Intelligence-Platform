using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Contracts;
using WaterOperations.Application.Features.Viewer.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/viewer")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
[Produces("application/json")]
public sealed class ViewerController(
    ISender sender)
    : ControllerBase
{
    [HttpGet("organizations")]
    [Tags("Viewer - Organizations")]
    public async Task<IActionResult> Organizations(
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetOrganizationsQuery(),
            cancellationToken);

        return Ok(
            ApiEnvelope.Ok(
                result,
                HttpContext.TraceIdentifier));
    }

    [HttpGet("organizations/{organizationId:guid}/regions")]
    [Tags("Viewer - Regions")]
    public async Task<IActionResult> Regions(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetRegionsQuery(organizationId),
            cancellationToken);

        return Ok(
            ApiEnvelope.Ok(
                result,
                HttpContext.TraceIdentifier));
    }

    [HttpGet("regions/{regionId:guid}/stations")]
    [Tags("Viewer - Stations")]
    public async Task<IActionResult> Stations(
        Guid regionId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetStationsQuery(regionId),
            cancellationToken);

        return Ok(
            ApiEnvelope.Ok(
                result,
                HttpContext.TraceIdentifier));
    }

    [HttpGet("stations/{stationId:guid}/measurements")]
    [Tags("Viewer - Measurements")]
    public async Task<IActionResult> Measurements(
        Guid stationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetMeasurementsQuery(stationId),
            cancellationToken);

        return Ok(
            ApiEnvelope.Ok(
                result,
                HttpContext.TraceIdentifier));
    }

    [HttpGet("stations/{stationId:guid}/alarms")]
    [Tags("Viewer - Alarms")]
    public async Task<IActionResult> Alarms(
        Guid stationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAlarmsQuery(stationId),
            cancellationToken);

        return Ok(
            ApiEnvelope.Ok(
                result,
                HttpContext.TraceIdentifier));
    }
}
