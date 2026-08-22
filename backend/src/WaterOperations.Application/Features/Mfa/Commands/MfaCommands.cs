using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Application.Features.Mfa.Interfaces;

namespace WaterOperations.Application.Features.Mfa.Commands;

public sealed record EnrollMfaCommand : ICommand<ScopeResult<MfaEnrollment>>, IRequireUser;

public sealed record VerifyMfaCommand(string Code) : ICommand<MfaCommandResult>, IRequireUser;

public sealed record RecoverMfaCommand(string Code) : ICommand<MfaCommandResult>, IRequireUser;

public sealed record MfaCommandResult(bool IsAuthorized, bool Succeeded);

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
        return ScopeResult.Authorized(result!);
    }
}

public sealed class VerifyMfaCommandHandler(
    IMfaRepository mfa,
    ICurrentUser currentUser)
    : ICommandHandler<VerifyMfaCommand, MfaCommandResult>
{
    public async Task<MfaCommandResult> Handle(
        VerifyMfaCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await mfa.VerifyAsync(
            currentUser.UserId!.Value,
            new MfaVerification(request.Code),
            cancellationToken);
        return new(true, succeeded);
    }
}

public sealed class RecoverMfaCommandHandler(
    IMfaRepository mfa,
    ICurrentUser currentUser)
    : ICommandHandler<RecoverMfaCommand, MfaCommandResult>
{
    public async Task<MfaCommandResult> Handle(
        RecoverMfaCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await mfa.RecoverAsync(
            currentUser.UserId!.Value,
            new MfaVerification(request.Code),
            cancellationToken);
        return new(true, succeeded);
    }
}
