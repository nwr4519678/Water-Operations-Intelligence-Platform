using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Authorize(Policy = AuthorizationPolicies.AdminOnly), Route("api/v1/ai/data/quality")]
public sealed class DataQualityController(IDataQualityService quality) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTimeOffset? fromUtc, [FromQuery] DateTimeOffset? toUtc, CancellationToken cancellationToken) =>
        Ok(await quality.ReadAsync(fromUtc, toUtc, cancellationToken));
}
