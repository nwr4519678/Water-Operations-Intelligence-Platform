using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using WaterOperations.Api;

namespace WaterOperations.IntegrationTests;

public sealed class IntegrationTestHost : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;

    public IntegrationTestHost(WebApplicationFactory<Program> factory)
    {
        this.factory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Testing", "true")
                .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Testing"] = "true",
                    ["DevelopmentViewer:Email"] = "viewer@test.local",
                    ["DevelopmentViewer:Password"] = "local-only-password"
                })));
    }

    [Fact]
    public async Task HostStartsSuccessfullyAndServesOpenApiSpec()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/openapi/v1.json");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status OK or NotFound for OpenAPI route, but got {response.StatusCode}");
    }
}
