using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Common;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(ViewerUserStore users, SessionStore sessions, AuthTokenService tokens) : ControllerBase
{
    public sealed record LoginRequest(string Email, string Password);
    public sealed record RefreshRequest(string RefreshToken);
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await users.FindAsync(request.Email, request.Password, cancellationToken);
        return user is null ? Unauthorized(new { error = "invalid_credentials" }) : Ok(Issue(user));
    }
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout(RefreshRequest request) => sessions.Revoke(request.RefreshToken) ? NoContent() : NoContent();
    [AllowAnonymous]
    [HttpPost("refresh")]
    public IActionResult Refresh(RefreshRequest request)
    {
        if (!sessions.TryConsume(request.RefreshToken, out var session)) return Unauthorized(new { error = "invalid_refresh_session" });
        var user = new ViewerUser(session.Email, string.Empty, session.Organization, session.Region, AuthorizationPolicies.ViewerRole);
        return Ok(Issue(user));
    }
    private object Issue(ViewerUser user) => new { accessToken = tokens.Create(user), refreshToken = sessions.Create(user.Email, user.Organization, user.Region), expiresIn = 900 };
}
