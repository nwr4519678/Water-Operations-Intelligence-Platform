using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Mfa.Commands;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/auth/mfa")]
[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class MfaController(
    ISender sender)
    : ControllerBase
{
    [HttpPost("enroll")]
    public async Task<IActionResult> Enroll(CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new EnrollMfaCommand(),
            cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify(
        MfaVerification request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new VerifyMfaCommand(request.Code),
            cancellationToken);
        return result.ToActionResult(this, "invalid_mfa_code");
    }

    [HttpPost("recovery")]
    public async Task<IActionResult> Recover(
        MfaVerification request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new RecoverMfaCommand(request.Code),
            cancellationToken);
        return result.ToActionResult(this, "invalid_recovery_code");
    }
}
