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
        return user is null ? Unauthorized(new { error = "invalid_credentials" }) : Ok(await IssueAsync(user, cancellationToken));
    }
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken cancellationToken)
    {
        await sessions.RevokeAsync(request.RefreshToken, cancellationToken);
        return NoContent();
    }
    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken cancellationToken)
    {
        var consumed = await sessions.TryConsumeAsync(request.RefreshToken, cancellationToken);
        if (!consumed.Success || consumed.Value is null) return Unauthorized(new { error = "invalid_refresh_session" });
        var session = consumed.Value;
        var user = new ViewerUser(session.Email, string.Empty, session.Organization, session.Region, session.Role);
        return Ok(await IssueAsync(user, cancellationToken));
    }
    private async Task<object> IssueAsync(ViewerUser user, CancellationToken cancellationToken) => new { accessToken = tokens.Create(user), refreshToken = await sessions.CreateAsync(user, cancellationToken), expiresIn = 900 };
}
