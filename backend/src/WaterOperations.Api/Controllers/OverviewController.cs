using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Viewer.Interfaces;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/overview")]
public sealed class OverviewController(IOverviewService overview) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTimeOffset? asOf, CancellationToken cancellationToken) =>
        Ok(await overview.GetAsync(asOf, cancellationToken));
}
