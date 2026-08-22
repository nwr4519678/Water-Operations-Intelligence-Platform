using WaterOperations.Application.Features.Mfa.DTOs;

namespace WaterOperations.Application.Features.Mfa.Interfaces;

public interface IMfaRepository
{
    public Task<MfaEnrollment?> EnrollAsync(
        Guid userId,
        CancellationToken cancellationToken);

    public Task<bool> VerifyAsync(
        Guid userId,
        MfaVerification request,
        CancellationToken cancellationToken);

    public Task<bool> RecoverAsync(
        Guid userId,
        MfaVerification request,
        CancellationToken cancellationToken);
}
