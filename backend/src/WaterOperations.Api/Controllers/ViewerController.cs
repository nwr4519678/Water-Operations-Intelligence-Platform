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

    [HttpGet("stations"), Tags("Core - Station Search")]
    public async Task<IActionResult> SearchStations([FromServices] WaterOperations.Application.Features.Viewer.Interfaces.IViewerReadService viewer, Guid? regionId, string? search, string? status, int page = 1, int pageSize = 50, CancellationToken ct = default) =>
        Ok(ApiEnvelope.Ok(await viewer.SearchStationsAsync(regionId, search, status, page, pageSize, ct), HttpContext.TraceIdentifier));

    [HttpGet("stations/{stationId:guid}"), Tags("Core - Station Details")]
    public async Task<IActionResult> StationDetail([FromServices] WaterOperations.Application.Features.Viewer.Interfaces.IViewerReadService viewer, Guid stationId, CancellationToken ct)
    {
        var result = await viewer.GetStationDetailAsync(stationId, ct);
        return result is null ? NotFound() : Ok(ApiEnvelope.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet("stations/{stationId:guid}/measurements/query"), Tags("Core - Chart Measurements")]
    public async Task<IActionResult> QueryMeasurements([FromServices] WaterOperations.Application.Features.Viewer.Interfaces.IViewerReadService viewer, Guid stationId, int? parameterId, DateTime? fromUtc, DateTime? toUtc, int page = 1, int pageSize = 500, CancellationToken ct = default) =>
        Ok(ApiEnvelope.Ok(await viewer.QueryMeasurementsAsync(stationId, parameterId, fromUtc, toUtc, page, pageSize, ct), HttpContext.TraceIdentifier));
}
