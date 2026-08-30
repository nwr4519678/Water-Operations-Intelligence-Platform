using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Infrastructure.Authentication;

namespace WaterOperations.UnitTests;

public sealed class AuthTokenServiceTests
{
    private readonly AuthTokenService service;

    public AuthTokenServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Authentication:Issuer"] = "test-issuer",
                ["Authentication:Audience"] = "test-audience"
            })
            .Build();

        service = new AuthTokenService(config);
    }

    [Fact]
    public void Create_GeneratesValidJwtTokenWithCorrectClaims()
    {
        var user = new AuthenticatedUser("admin@water.local", "Org123", "Reg456", "ADMIN");

        var tokenString = service.Create(user);

        Assert.False(string.IsNullOrWhiteSpace(tokenString));

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        Assert.Equal("test-issuer", jwtToken.Issuer);
        Assert.Contains(jwtToken.Audiences, a => a == "test-audience");
        Assert.Equal("admin@water.local", jwtToken.Claims.First(c => c.Type == ClaimTypes.Email || c.Type == "email").Value);
        Assert.Equal("ADMIN", jwtToken.Claims.First(c => c.Type == "role").Value);
        Assert.Equal("Org123", jwtToken.Claims.First(c => c.Type == "organization").Value);
        Assert.Equal("Reg456", jwtToken.Claims.First(c => c.Type == "region").Value);
    }

    [Fact]
    public void Create_WhenUserIdIsEmpty_GeneratesDeterministicStableUserId()
    {
        var user1 = new AuthenticatedUser("same.user@test.local", "Org1", "Reg1", "VIEWER") { UserId = Guid.Empty };
        var user2 = new AuthenticatedUser("SAME.USER@TEST.LOCAL", "Org1", "Reg1", "VIEWER") { UserId = Guid.Empty };

        var token1 = service.Create(user1);
        var token2 = service.Create(user2);

        var handler = new JwtSecurityTokenHandler();
        var sub1 = handler.ReadJwtToken(token1).Claims.First(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.Sub || c.Type == "nameid").Value;
        var sub2 = handler.ReadJwtToken(token2).Claims.First(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.Sub || c.Type == "nameid").Value;

        Assert.Equal(sub1, sub2);
    }
}
