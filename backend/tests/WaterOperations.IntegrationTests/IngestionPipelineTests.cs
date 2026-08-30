using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using WaterOperations.Api;

namespace WaterOperations.IntegrationTests;

public sealed class IngestionPipelineTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public IngestionPipelineTests(WebApplicationFactory<Program> factory)
    {
        client = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Testing", "true")
                .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Testing"] = "true",
                    ["DevelopmentViewer:Email"] = "admin@test.local",
                    ["DevelopmentViewer:Password"] = "admin-password",
                    ["DevelopmentViewer:Organization"] = "11111111-1111-1111-1111-111111111111",
                    ["DevelopmentViewer:Region"] = "1"
                }))).CreateClient();
    }

    [Fact]
    public async Task Ingestion_UnauthenticatedCall_ReturnsUnauthorized()
    {
        var response = await client.PostAsJsonAsync("/api/v1/ingestion/batches", new
        {
            sourceType = "SCADA",
            readings = Array.Empty<object>()
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
