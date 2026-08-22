using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Api.Common;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/auth/mfa"), Authorize]
public sealed class MfaController(MfaService mfa, MfaChallengeTokenService challenges, ViewerUserStore users, AuthTokenService tokens, SessionStore sessions) : ControllerBase
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

    [AllowAnonymous]
    [HttpPost("challenge")]
    public async Task<IActionResult> Challenge(ChallengeRequest request, CancellationToken cancellationToken)
    {
        if (!challenges.TryRead(request.ChallengeToken, out var userId)) return Unauthorized(new { error = "invalid_mfa_challenge" });
        if (!await mfa.VerifyAsync(userId, request.Code, cancellationToken)) return Unauthorized(new { error = "invalid_mfa_code" });
        var user = await users.FindByIdAsync(userId, cancellationToken);
        return user is null ? Unauthorized(new { error = "invalid_mfa_user" }) : Ok(new { accessToken = tokens.Create(user), refreshToken = await sessions.CreateAsync(user, cancellationToken), expiresIn = 900 });
    }

    [HttpPost("{userId:guid}/reset"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Reset(Guid userId, CancellationToken cancellationToken)
    {
        await mfa.ResetAsync(userId, cancellationToken);
        return NoContent();
    }

    public sealed record VerifyRequest(string Code);
    public sealed record ChallengeRequest(string ChallengeToken, string Code);
    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue("sub"), out userId);
}
