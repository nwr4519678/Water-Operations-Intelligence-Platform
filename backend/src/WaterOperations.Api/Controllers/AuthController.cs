using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Auth.Commands;
using WaterOperations.Application.Features.Auth.DTOs;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
    ISender sender)
    : ControllerBase
{
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new LoginCommand(request),
            cancellationToken);
        return result.ToAuthenticationResult(this, "invalid_credentials");
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        RefreshRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new LogoutCommand(request.RefreshToken),
            cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new RefreshCommand(request.RefreshToken),
            cancellationToken);
        return result.ToAuthenticationResult(this, "invalid_refresh_session");
    }
}
