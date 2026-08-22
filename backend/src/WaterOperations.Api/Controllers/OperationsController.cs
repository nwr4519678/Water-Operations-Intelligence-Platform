using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Operations.Queries;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class OperationsController(ISender sender) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(
        [FromQuery] DateTimeOffset? asOf,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetOperationsOverviewQuery(asOf),
            cancellationToken);

        return result.ToActionResult(this);
    }

    [HttpGet("ai/data/quality")]
    public async Task<IActionResult> DataQuality(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetDataQualityQuery(from, to, pagination),
            cancellationToken);

        return result.ToActionResult(this);
    }
}
