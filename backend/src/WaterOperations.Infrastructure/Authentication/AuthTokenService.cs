using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Infrastructure.Authentication;

public sealed class AuthTokenService(IConfiguration configuration) : IAccessTokenIssuer
{
    public string Create(AuthenticatedUser user)
    {
        var userId = user.UserId == Guid.Empty
            ? StableUserId(user.Email)
            : user.UserId;
        var key = configuration["Authentication:SigningKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = AuthenticationConstants.DevSigningKey;
        }
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString("D")),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("role", user.Role),
            new Claim("organization", user.Organization),
            new Claim("region", user.Region)
        };
        return new JwtSecurityTokenHandler().WriteToken(
            new JwtSecurityToken(
                issuer: configuration["Authentication:Issuer"] ?? "water-operations",
                audience: configuration["Authentication:Audience"] ?? "water-operations-web",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    configuration.GetValue("Authentication:AccessTokenMinutes", 30)),
                signingCredentials: credentials));
    }

    private static Guid StableUserId(string email)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(email.Trim().ToUpperInvariant()));
        return new Guid(hash.AsSpan(0, 16));
    }
}
