using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Auth.Commands;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Mfa.Commands;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LoginCommand(request), cancellationToken);
        return result.ToAuthenticationResult(this, "invalid_credentials");
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(new LogoutCommand(request.RefreshToken), cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RefreshCommand(request.RefreshToken), cancellationToken);
        return result.ToAuthenticationResult(this, "invalid_refresh_session");
    }

    [Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
    [HttpPost("mfa/enroll")]
    public async Task<IActionResult> EnrollMfa(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new EnrollMfaCommand(), cancellationToken);
        return result.ToActionResult(this);
    }

    [Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
    [HttpPost("mfa/verify")]
    public async Task<IActionResult> VerifyMfa(
        [FromBody] MfaVerification request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new VerifyMfaCommand(request.Code), cancellationToken);
        return result.ToActionResult(this, "invalid_mfa_code");
    }

    [Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
    [HttpPost("mfa/recovery")]
    public async Task<IActionResult> RecoverMfa(
        [FromBody] MfaVerification request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RecoverMfaCommand(request.Code), cancellationToken);
        return result.ToActionResult(this, "invalid_recovery_code");
    }
}
