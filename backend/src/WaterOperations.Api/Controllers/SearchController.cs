using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/search"), Authorize, EnableRateLimiting("search")]
public sealed class SearchController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new SearchProductQuery(query, pagination), ct)).ToActionResult(this);
}
