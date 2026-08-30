using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using WaterOperations.Api;

namespace WaterOperations.IntegrationTests;

public sealed class SecurityHeadersTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public SecurityHeadersTests(WebApplicationFactory<Program> factory)
    {
        client = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Testing", "true")
                .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Testing"] = "true"
                }))).CreateClient();
    }

    [Fact]
    public async Task SecurityMiddleware_AppliesExpectedSecurityHeaders()
    {
        var response = await client.GetAsync("/api/v1/telemetry");

        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());

        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());

        Assert.True(response.Headers.Contains("X-API-Version"));
        Assert.Equal("v1", response.Headers.GetValues("X-API-Version").First());
    }
}
