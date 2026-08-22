using System.Net;
using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Application.Features.Mfa.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Mfa;

public sealed class EfMfaRepository(
    IRepositoryContext repository,
    IUnitOfWork unitOfWork,
    IDataProtectionProvider protectionProvider) : IMfaRepository
{
    private readonly IDataProtector protector =
        protectionProvider.CreateProtector("water-operations:mfa:v1");

    public async Task<MfaEnrollment?> EnrollAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await repository.Query<User>()
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var secret = RandomNumberGenerator.GetBytes(20);
        var enrollment = user.SetMfaSecret(protector.Protect(secret));
        if (!enrollment.IsSuccess)
        {
            return null;
        }
        var recoveryCodes = Enumerable.Range(0, 10)
            .Select(_ => $"{RandomNumberGenerator.GetInt32(10000000, 100000000)}")
            .ToArray();
        var existingCodes = await repository.Query<MfaRecoveryCode>()
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);
        repository.RemoveRange(existingCodes);
        repository.AddRange(
            recoveryCodes.Select(code => new MfaRecoveryCode
            {
                MfaRecoveryCodeId = Guid.NewGuid(),
                UserId = userId,
                CodeHash = Hash(code),
                CreatedAtUtc = DateTime.UtcNow
            }));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new MfaEnrollment(Base32(secret), recoveryCodes, "pending");
    }

    public async Task<bool> VerifyAsync(
        Guid userId,
        MfaVerification request,
        CancellationToken cancellationToken)
    {
        var user = await repository.Query<User>()
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user?.MfaSecretEncrypted is null
            || !Verify(protector.Unprotect(user.MfaSecretEncrypted), request.Code))
        {
            return false;
        }

        if (!user.EnableMfa().IsSuccess)
        {
            return false;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RecoverAsync(
        Guid userId,
        MfaVerification request,
        CancellationToken cancellationToken)
    {
        var code = await repository.Query<MfaRecoveryCode>()
            .SingleOrDefaultAsync(
                x => x.UserId == userId
                    && x.CodeHash == Hash(request.Code)
                    && x.UsedAtUtc == null,
                cancellationToken);
        if (code is null)
        {
            return false;
        }

        code.UsedAtUtc = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string Base32(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .ToUpperInvariant();

#pragma warning disable CA5350
    private static bool Verify(byte[] secret, string code)
    {
        if (!int.TryParse(code, out var expected))
        {
            return false;
        }

        var counter = BitConverter.GetBytes(
            IPAddress.HostToNetworkOrder(DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30));
        using var hmac = new HMACSHA1(secret);
        var hash = hmac.ComputeHash(counter);
        var offset = hash[^1] & 0x0f;
        var value = ((hash[offset] & 0x7f) << 24)
            | (hash[offset + 1] << 16)
            | (hash[offset + 2] << 8)
            | hash[offset + 3];
        return value % 1_000_000 == expected;
    }
#pragma warning restore CA5350

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value)));
}
