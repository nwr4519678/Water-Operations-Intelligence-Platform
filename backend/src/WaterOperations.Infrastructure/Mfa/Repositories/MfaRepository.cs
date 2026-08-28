using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Application.Features.Mfa.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Mfa.Repositories;

public sealed class MfaRepository(
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

        var base32Secret = Base32(secret);
        var qrCodeUri = $"otpauth://totp/WaterOperations:{user.Email}?secret={base32Secret}&issuer=WaterOperations";

        return new MfaEnrollment(base32Secret, recoveryCodes, qrCodeUri);
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

    private static string Base32(byte[] bytes)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var output = new StringBuilder((bytes.Length * 8 + 4) / 5);
        int bitBuffer = 0, bitCount = 0;
        foreach (var b in bytes)
        {
            bitBuffer = (bitBuffer << 8) | b;
            bitCount += 8;
            while (bitCount >= 5)
            {
                bitCount -= 5;
                output.Append(alphabet[(bitBuffer >> bitCount) & 31]);
            }
        }
        if (bitCount > 0)
        {
            output.Append(alphabet[(bitBuffer << (5 - bitCount)) & 31]);
        }
        return output.ToString();
    }

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
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
