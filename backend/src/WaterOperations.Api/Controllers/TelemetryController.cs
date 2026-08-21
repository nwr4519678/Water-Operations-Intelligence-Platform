using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/telemetry"), Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryController(TelemetryStore telemetry) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(telemetry.ForScope(User.FindFirstValue("organization")!, User.FindFirstValue("region")!));
    [HttpPost("start")]
    public IActionResult Start() => Forbid();
}
