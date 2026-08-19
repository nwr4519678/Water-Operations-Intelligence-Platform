using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Common;

public sealed class AuthTokenService(IConfiguration configuration)
{
    public string Create(ViewerUser user)
    {
        var key = configuration["Authentication:SigningKey"] ?? "development-only-signing-key-change-me-please";
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(ClaimTypes.Name, user.Email), new Claim(ClaimTypes.Email, user.Email), new Claim("role", user.Role), new Claim("organization", user.Organization), new Claim("region", user.Region) };
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: configuration["Authentication:Issuer"] ?? "water-operations", audience: configuration["Authentication:Audience"] ?? "water-operations-web",
            claims: claims, expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: credentials));
    }
}
