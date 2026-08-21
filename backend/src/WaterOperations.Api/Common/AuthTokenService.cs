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
        var claims = new List<Claim> { new(ClaimTypes.Name, user.Email), new(ClaimTypes.Email, user.Email), new("role", user.Role), new("organization", user.Organization), new("region", user.Region) };
        if (user.UserId is not null) claims.Add(new Claim(JwtRegisteredClaimNames.Sub, user.UserId.Value.ToString()));
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: configuration["Authentication:Issuer"] ?? "water-operations", audience: configuration["Authentication:Audience"] ?? "water-operations-web",
            claims: claims, expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: credentials));
    }
}
