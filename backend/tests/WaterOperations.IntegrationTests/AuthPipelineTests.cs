using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace WaterOperations.IntegrationTests;

public sealed class AuthPipelineTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;
    public AuthPipelineTests(WebApplicationFactory<Program> factory)
    {
        client = factory.WithWebHostBuilder(builder => builder.UseSetting("Testing", "true").ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Testing"] = "true", ["DevelopmentViewer:Email"] = "viewer@test.local", ["DevelopmentViewer:Password"] = "local-only-password",
            ["DevelopmentViewer:Organization"] = "A", ["DevelopmentViewer:Region"] = "1"
        }))).CreateClient();
    }

    [Fact]
    public async Task AnonymousTelemetryReturnsUnauthorizedViewerIsScopedAndMutationIsForbidden()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/telemetry")).StatusCode);
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = "viewer@test.local", password = "local-only-password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var auth = await login.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization = new("Bearer", auth!.AccessToken);
        var telemetry = await client.GetFromJsonAsync<List<TelemetryResponse>>("/api/v1/telemetry");
        Assert.Single(telemetry!);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsync("/api/v1/telemetry/start", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = "bad" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = auth.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken })).StatusCode);
    }

    private sealed record TokenResponse(string AccessToken, string RefreshToken, int ExpiresIn);
    private sealed record TelemetryResponse(string Id, string Organization, string Region, double Value);
}
