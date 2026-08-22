using MediatR;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Contracts;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Operations.Queries;
using WaterOperations.Application.Features.Stations.Queries;
using WaterOperations.Application.Features.Telemetry.Queries;
using WaterOperations.Application.Features.Viewer.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/viewer")]
[Produces("application/json")]
public sealed class ViewerController(
    ISender sender)
    : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview([FromQuery] DateTimeOffset? asOf, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetOperationsOverviewQuery(asOf), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("map/stations")]
    public async Task<IActionResult> MapStations(
        [FromQuery] string? search,
        [FromQuery] Guid? regionId,
        [FromQuery] string? status,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SearchStationsQuery(search, regionId, status, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("stations/{stationId:guid}")]
    public async Task<IActionResult> Station(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStationQuery(stationId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("alarms")]
    public async Task<IActionResult> AlarmSearch(
        [FromQuery] Guid? stationId,
        [FromQuery] string? severity,
        [FromQuery] string? status,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SearchViewerAlarmsQuery(stationId, severity, status, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("alarms/{alarmId:guid}")]
    public async Task<IActionResult> Alarm(Guid alarmId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetViewerAlarmQuery(alarmId), cancellationToken);
        return result.ToActionResult(this);
    }

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
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int? parameterId,
        [FromQuery] int? limit,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetTelemetryQuery(from, to, stationId, parameterId, limit),
            cancellationToken);

        return result.ToTelemetryResult(this);
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
