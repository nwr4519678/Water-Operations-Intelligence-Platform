using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Application.Features.Mfa.Interfaces;

namespace WaterOperations.Application.Features.Mfa.Commands;

public sealed record EnrollMfaCommand : ICommand<ScopeResult<MfaEnrollment>>, IRequireUser;

public sealed record VerifyMfaCommand(string Code) : ICommand<ScopeResult<bool>>, IRequireUser;

public sealed record RecoverMfaCommand(string Code) : ICommand<ScopeResult<bool>>, IRequireUser;

public sealed class EnrollMfaCommandHandler(
    IMfaRepository mfa,
    ICurrentUser currentUser)
    : ICommandHandler<EnrollMfaCommand, ScopeResult<MfaEnrollment>>
{
    public async Task<ScopeResult<MfaEnrollment>> Handle(
        EnrollMfaCommand request,
        CancellationToken cancellationToken)
    {
        var result = await mfa.EnrollAsync(
            currentUser.UserId!.Value,
            cancellationToken);

        // BUG-3 fix: null means the user record was not found — return NotFound
        // instead of null-forgiving Authorized which crashes JSON serialization.
        return result is null
            ? ScopeResult.NotFound<MfaEnrollment>()
            : ScopeResult.Authorized(result);
    }
}

public sealed class VerifyMfaCommandHandler(
    IMfaRepository mfa,
    ICurrentUser currentUser)
    : ICommandHandler<VerifyMfaCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        VerifyMfaCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await mfa.VerifyAsync(
            currentUser.UserId!.Value,
            new MfaVerification(request.Code),
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class RecoverMfaCommandHandler(
    IMfaRepository mfa,
    ICurrentUser currentUser)
    : ICommandHandler<RecoverMfaCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        RecoverMfaCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await mfa.RecoverAsync(
            currentUser.UserId!.Value,
            new MfaVerification(request.Code),
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
