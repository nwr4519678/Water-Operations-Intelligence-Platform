using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Reports.Commands;
using WaterOperations.Application.Features.Reports.DTOs;
using WaterOperations.Application.Features.Reports.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class ReportsController(ISender sender) : ControllerBase
{
    [HttpGet("reports")]
    public async Task<IActionResult> List(
        [FromQuery] ReportFilter filter,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetReportsQuery(filter, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("reports")]
    public async Task<IActionResult> Create(
        [FromBody] CreateReportCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("reports/{reportId:guid}")]
    public async Task<IActionResult> Get(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetReportQuery(reportId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("reports/{reportId:guid}/download")]
    public async Task<IActionResult> Download(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DownloadReportQuery(reportId), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("reports/schedules")]
    public async Task<IActionResult> CreateSchedule(
        [FromBody] CreateReportScheduleCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPatch("reports/schedules/{scheduleId:long}")]
    public async Task<IActionResult> SetScheduleActive(
        long scheduleId,
        [FromBody] SetReportScheduleActiveCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command with { ScheduleId = scheduleId }, cancellationToken);
        return result.ToActionResult(this);
    }
}
