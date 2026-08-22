using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/auth/mfa"), Authorize]
public sealed class MfaController(MfaService mfa) : ControllerBase
{
    [HttpPost("enroll")]
    public async Task<IActionResult> Enroll(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await mfa.EnrollAsync(userId, cancellationToken));
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify(VerifyRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        return await mfa.VerifyAsync(userId, request.Code, cancellationToken) ? NoContent() : Unauthorized(new { error = "invalid_mfa_code" });
    }

    [HttpPost("{userId:guid}/reset"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Reset(Guid userId, CancellationToken cancellationToken)
    {
        await mfa.ResetAsync(userId, cancellationToken);
        return NoContent();
    }

    public sealed record VerifyRequest(string Code);
    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue("sub"), out userId);
}
