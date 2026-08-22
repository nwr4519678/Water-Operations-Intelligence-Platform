


namespace WaterOperations.Application.Features.Mfa.DTOs;

public sealed record MfaEnrollment(
    string Secret,
    IReadOnlyList<string> RecoveryCodes,
    string Status);

public sealed record MfaVerification(
    string Code);
