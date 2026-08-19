using Microsoft.AspNetCore.Mvc;
using MediatR;
using WaterOperations.Api.Common;
using WaterOperations.Application.Features.Viewer.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/viewer")]
[Produces("application/json")]
public sealed class ViewerController(ISender sender) : ControllerBase
{
    [HttpGet("organizations"), Tags("Viewer - Organizations")]
    public async Task<IActionResult> Organizations(CancellationToken ct) => Ok(ApiEnvelope.Ok(await sender.Send(new GetOrganizationsQuery(), ct), HttpContext.TraceIdentifier));
    [HttpGet("organizations/{organizationId:guid}/regions"), Tags("Viewer - Regions")]
    public async Task<IActionResult> Regions(Guid organizationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await sender.Send(new GetRegionsQuery(organizationId), ct), HttpContext.TraceIdentifier));
    [HttpGet("regions/{regionId:guid}/stations"), Tags("Viewer - Stations")]
    public async Task<IActionResult> Stations(Guid regionId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await sender.Send(new GetStationsQuery(regionId), ct), HttpContext.TraceIdentifier));
    [HttpGet("stations/{stationId:guid}/measurements"), Tags("Viewer - Measurements")]
    public async Task<IActionResult> Measurements(Guid stationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await sender.Send(new GetMeasurementsQuery(stationId), ct), HttpContext.TraceIdentifier));
    [HttpGet("stations/{stationId:guid}/alarms"), Tags("Viewer - Alarms")]
    public async Task<IActionResult> Alarms(Guid stationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await sender.Send(new GetAlarmsQuery(stationId), ct), HttpContext.TraceIdentifier));
}
