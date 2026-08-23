using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1"), Authorize]
public sealed class ReportsController(ISender sender) : ControllerBase
{
    [HttpGet("reports")]
    public async Task<IActionResult> List([FromQuery] ReportFilter filter, [FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new GetReportsQuery(filter, pagination), ct)).ToActionResult(this);

    [HttpPost("reports")]
    public async Task<IActionResult> Create([FromBody] CreateReportCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpGet("reports/{reportId:guid}")]
    public async Task<IActionResult> Get(Guid reportId, CancellationToken ct) => (await sender.Send(new GetReportQuery(reportId), ct)).ToActionResult(this);

    [HttpGet("reports/{reportId:guid}/download")]
    public async Task<IActionResult> Download(Guid reportId, CancellationToken ct)
    {
        var result = await sender.Send(new DownloadReportQuery(reportId), ct);
        return !result.IsAuthorized ? (result.IsNotFound ? NotFound() : Forbid()) : File(result.Value!.Content, result.Value.ContentType, result.Value.FileName);
    }

    [HttpPost("reports/schedules")]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateReportScheduleCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpPatch("reports/schedules/{scheduleId:long}")]
    public async Task<IActionResult> SetScheduleActive(long scheduleId, [FromBody] SetReportScheduleActiveCommand command, CancellationToken ct) => (await sender.Send(command with { ScheduleId = scheduleId }, ct)).ToActionResult(this);
}
