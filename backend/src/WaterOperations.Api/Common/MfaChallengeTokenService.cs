using System.Globalization;
using Microsoft.AspNetCore.DataProtection;

namespace WaterOperations.Api.Common;

public sealed class MfaChallengeTokenService(IDataProtectionProvider provider)
{
    private readonly IDataProtector protector = provider.CreateProtector("water-operations:mfa-login-challenge:v1");

    public string Create(Guid userId) => protector.Protect($"{userId:N}|{DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds()}");

    public bool TryRead(string token, out Guid userId)
    {
        userId = default;
        try
        {
            var parts = protector.Unprotect(token).Split('|');
            return parts.Length == 2 && Guid.TryParseExact(parts[0], "N", out userId) &&
                long.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var expires) &&
                DateTimeOffset.UtcNow.ToUnixTimeSeconds() <= expires;
        }
        catch (Exception) when (token.Length > 0)
        {
            return false;
        }
    }
}
