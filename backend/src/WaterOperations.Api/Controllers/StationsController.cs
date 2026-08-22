using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Stations.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/stations")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class StationsController(
    ISender sender)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] Guid? regionId,
        [FromQuery] string? status,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new SearchStationsQuery(search, regionId, status, pagination),
            cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("{stationId:guid}")]
    public async Task<IActionResult> Get(
        Guid stationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStationQuery(stationId), cancellationToken);
        return result.ToActionResult(this);
    }
}
