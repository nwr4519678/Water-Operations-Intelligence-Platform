using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Thresholds.Commands;
using WaterOperations.Application.Features.Thresholds.DTOs;
using WaterOperations.Application.Features.Thresholds.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/thresholds")]
[Authorize]
[Produces("application/json")]
public sealed class ThresholdsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid? stationId,
        [FromQuery] int? parameterId,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetThresholdsQuery(stationId, parameterId, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create(
        [FromBody] CreateThresholdRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateThresholdCommand(request), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] UpdateThresholdRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateThresholdCommand(id, request), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Deactivate(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeactivateThresholdCommand(id), cancellationToken);
        return result.ToActionResult(this);
    }
}
