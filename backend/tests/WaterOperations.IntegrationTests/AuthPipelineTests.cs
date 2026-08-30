using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using WaterOperations.Api;

namespace WaterOperations.IntegrationTests;

public sealed class AuthPipelineTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public AuthPipelineTests(WebApplicationFactory<Program> factory)
    {
        client = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Testing", "true")
                .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Testing"] = "true",
                    ["DevelopmentViewer:Email"] = "viewer@test.local",
                    ["DevelopmentViewer:Password"] = "local-only-password",
                    ["DevelopmentViewer:Organization"] = "11111111-1111-1111-1111-111111111111",
                    ["DevelopmentViewer:Region"] = "1"
                }))).CreateClient();
    }

    [Fact]
    public async Task AnonymousTelemetryReturnsUnauthorized_ViewerIsScoped_AndMutationIsForbidden()
    {
        // 1. Anonymous request to protected telemetry endpoint fails with 401 Unauthorized
        var unauthenticatedResult = await client.GetAsync("/api/v1/telemetry");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticatedResult.StatusCode);

        // 2. Login as DevelopmentViewer
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "viewer@test.local",
            password = "local-only-password"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var auth = await loginResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth.AccessToken));

        // 3. Authenticated request with Bearer token succeeds
        client.DefaultRequestHeaders.Authorization = new("Bearer", auth.AccessToken);
        var telemetryResult = await client.GetAsync("/api/v1/telemetry");
        Assert.Equal(HttpStatusCode.OK, telemetryResult.StatusCode);

        // 4. Prohibited mutation endpoint returns 403 Forbidden for viewer role
        var forbiddenMutation = await client.GetAsync("/api/v1/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenMutation.StatusCode);

        // 5. Invalid refresh token returns 401
        var invalidRefresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = "bad-token" });
        Assert.Equal(HttpStatusCode.Unauthorized, invalidRefresh.StatusCode);

        // 6. Logout succeeds with 204 NoContent
        var logoutResponse = await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        // 7. Revoked refresh token cannot be reused
        var revokedRefresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, revokedRefresh.StatusCode);
    }

    private sealed record TokenResponse(string AccessToken, string RefreshToken, int ExpiresIn);
}
