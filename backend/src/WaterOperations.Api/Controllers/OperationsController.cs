using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Operations.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/operations")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class OperationsController(ISender sender) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(
        [FromQuery] DateTimeOffset? asOf,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetOperationsOverviewQuery(asOf), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("data-quality")]
    public async Task<IActionResult> DataQuality(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? until,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDataQualityQuery(from, until, pagination), cancellationToken);
        return result.ToActionResult(this);
    }
}
