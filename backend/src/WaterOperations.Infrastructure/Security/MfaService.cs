using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Security;

public sealed record MfaEnrollment(string SecretBase32, IReadOnlyList<string> RecoveryCodes);

public sealed class MfaService(WaterOperationsDbContext db, IDataProtectionProvider protectionProvider)
{
    private readonly IDataProtector protector = protectionProvider.CreateProtector("water-operations:mfa:v1");

    public async Task<MfaEnrollment> EnrollAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.UserId == userId && x.IsActive, cancellationToken)
            ?? throw new UnauthorizedAccessException("User not found.");
        var secret = RandomNumberGenerator.GetBytes(20);
        var recoveryCodes = Enumerable.Range(0, 8).Select(_ => Convert.ToHexString(RandomNumberGenerator.GetBytes(5))).ToArray();
        user.MfaSecretEncrypted = protector.Protect(JsonSerializer.SerializeToUtf8Bytes(new MfaState(Convert.ToBase64String(secret), recoveryCodes.Select(Hash).ToArray())));
        user.IsMfaEnabled = false;
        await db.SaveChangesAsync(cancellationToken);
        return new MfaEnrollment(Base32(secret), recoveryCodes);
    }

    public async Task<bool> VerifyAsync(Guid userId, string code, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.UserId == userId && x.IsActive, cancellationToken);
        if (user is null || user.MfaSecretEncrypted is null || string.IsNullOrWhiteSpace(code)) return false;
        var state = Unprotect(user.MfaSecretEncrypted);
        var secret = Convert.FromBase64String(state.SecretBase64);
        var normalized = code.Replace(" ", string.Empty, StringComparison.Ordinal).Trim().ToUpperInvariant();
        var valid = Enumerable.Range(-1, 3).Any(offset => Totp(secret, DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30 + offset) == normalized);
        if (!valid)
        {
            var hash = Hash(normalized);
            var index = Array.IndexOf(state.RecoveryCodeHashes, hash);
            if (index < 0) return false;
            state.RecoveryCodeHashes = state.RecoveryCodeHashes.Where((_, i) => i != index).ToArray();
        }
        user.IsMfaEnabled = true;
        user.MfaSecretEncrypted = protector.Protect(JsonSerializer.SerializeToUtf8Bytes(state));
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task ResetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user is null) return;
        user.IsMfaEnabled = false;
        user.MfaSecretEncrypted = null;
        await db.SaveChangesAsync(cancellationToken);
    }

    private MfaState Unprotect(byte[] payload) => JsonSerializer.Deserialize<MfaState>(protector.Unprotect(payload)) ?? throw new CryptographicException("Invalid MFA state.");
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static string Totp(byte[] secret, long counter)
    {
        Span<byte> bytes = stackalloc byte[8];
        for (var i = 7; i >= 0; i--) { bytes[i] = (byte)(counter & 0xff); counter >>= 8; }
        var digest = HMACSHA1.HashData(secret, bytes);
        var offset = digest[^1] & 0x0f;
        var value = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
        return (value % 1_000_000).ToString("D6");
    }

    private static string Base32(ReadOnlySpan<byte> data)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var output = new StringBuilder((data.Length + 4) / 5 * 8);
        var buffer = 0; var bits = 0;
        foreach (var value in data)
        {
            buffer = (buffer << 8) | value; bits += 8;
            while (bits >= 5) { output.Append(alphabet[(buffer >> (bits - 5)) & 31]); bits -= 5; }
        }
        if (bits > 0) output.Append(alphabet[(buffer << (5 - bits)) & 31]);
        return output.ToString();
    }

    private sealed class MfaState(string secretBase64, string[] recoveryCodeHashes)
    {
        public string SecretBase64 { get; set; } = secretBase64;
        public string[] RecoveryCodeHashes { get; set; } = recoveryCodeHashes;
    }
}
