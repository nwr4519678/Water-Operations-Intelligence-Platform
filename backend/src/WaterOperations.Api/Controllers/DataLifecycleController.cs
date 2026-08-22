using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Infrastructure.Privacy;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/admin/data-lifecycle"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public sealed class DataLifecycleController(DataLifecycleService lifecycle) : ControllerBase
{
    public sealed record PurgeRequest(DateTime BeforeUtc, string IdempotencyKey, bool DryRun = true);

    [HttpPost("purge")]
    public async Task<IActionResult> Purge(PurgeRequest request, CancellationToken cancellationToken)
    {
        var actor = Guid.TryParse(User.FindFirstValue("sub"), out var actorId) ? actorId : (Guid?)null;
        try
        {
            return Ok(await lifecycle.PurgeAsync(request.BeforeUtc, request.IdempotencyKey, request.DryRun, actor, cancellationToken));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = "invalid_purge_request", reason = exception.Message });
        }
    }
}
