using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Common;
using WaterOperations.Application.Viewer;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/viewer")]
[Produces("application/json")]
public sealed class ViewerController(IViewerReadService service) : ControllerBase
{
    [HttpGet("organizations"), Tags("Viewer - Organizations")]
    public async Task<IActionResult> Organizations(CancellationToken ct) => Ok(ApiEnvelope.Ok(await service.GetOrganizationsAsync(ct), HttpContext.TraceIdentifier));
    [HttpGet("organizations/{organizationId:guid}/regions"), Tags("Viewer - Regions")]
    public async Task<IActionResult> Regions(Guid organizationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await service.GetRegionsAsync(organizationId, ct), HttpContext.TraceIdentifier));
    [HttpGet("regions/{regionId:guid}/stations"), Tags("Viewer - Stations")]
    public async Task<IActionResult> Stations(Guid regionId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await service.GetStationsAsync(regionId, ct), HttpContext.TraceIdentifier));
    [HttpGet("stations/{stationId:guid}/measurements"), Tags("Viewer - Measurements")]
    public async Task<IActionResult> Measurements(Guid stationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await service.GetMeasurementsAsync(stationId, ct), HttpContext.TraceIdentifier));
    [HttpGet("stations/{stationId:guid}/alarms"), Tags("Viewer - Alarms")]
    public async Task<IActionResult> Alarms(Guid stationId, CancellationToken ct) => Ok(ApiEnvelope.Ok(await service.GetAlarmsAsync(stationId, ct), HttpContext.TraceIdentifier));
}
