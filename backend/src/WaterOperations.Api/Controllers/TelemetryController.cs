using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/telemetry"), Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryController(ITelemetryReadService telemetry, TelemetryStore? testTelemetry = null) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var organization = User.FindFirstValue("organization")!;
        var region = User.FindFirstValue("region")!;
        if (testTelemetry is not null) return Ok(testTelemetry.ForScope(organization, region));
        return Ok(await telemetry.GetAsync(organization, region, cancellationToken));
    }
    [HttpPost("start")]
    public IActionResult Start() => Forbid();
}
