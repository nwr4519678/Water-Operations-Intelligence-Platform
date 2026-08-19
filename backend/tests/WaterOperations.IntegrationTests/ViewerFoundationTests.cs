using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Viewer;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Seeding;

namespace WaterOperations.IntegrationTests;

public sealed class ViewerFoundationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;
    public ViewerFoundationTests(WebApplicationFactory<Program> factory) => this.factory = factory;

    [Fact]
    public async Task HealthAndViewerContractReturnTraceableEnvelopes()
    {
        using var client = factory.WithWebHostBuilder(Testing).CreateClient();
        using var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.Contains("X-Trace-Id"));
        Assert.Contains("Healthy", await response.Content.ReadAsStringAsync());
        using var viewer = await client.GetAsync("/api/v1/viewer/organizations");
        Assert.Equal(HttpStatusCode.OK, viewer.StatusCode);
        using var json = JsonDocument.Parse(await viewer.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("success").GetBoolean());
        Assert.Equal("/api/v1/viewer/organizations", viewer.RequestMessage!.RequestUri!.AbsolutePath);
    }

    [Fact]
    public async Task SeedIsDeterministicAndRepeatable()
    {
        using var scope = factory.WithWebHostBuilder(Testing).Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
        await ViewerSeed.SeedAsync(db);
        await ViewerSeed.SeedAsync(db);
        Assert.Equal(1, await db.Organizations.CountAsync());
        Assert.Equal(2, await db.Regions.CountAsync());
        Assert.Equal(4, await db.Stations.CountAsync());
        Assert.Equal(12, await db.Measurements.CountAsync());
        Assert.Equal(4, await db.Alarms.CountAsync());
    }

    [Fact]
    public async Task UnexpectedApplicationFailureReturnsSafeEnvelopeWithTraceId()
    {
        using var client = factory.WithWebHostBuilder(builder => builder
            .UseSetting("Testing", "true")
            .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> { ["Testing"] = "true", ["Seed:Enabled"] = "false" }))
            .ConfigureTestServices(services =>
            {
                services.RemoveAll<IViewerReadService>();
                services.AddScoped<IViewerReadService, ThrowingViewerReadService>();
            })).CreateClient();
        using var response = await client.GetAsync("/api/v1/viewer/organizations");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.False(json.RootElement.GetProperty("success").GetBoolean());
        Assert.Equal("INTERNAL_ERROR", json.RootElement.GetProperty("error").GetProperty("code").GetString());
        Assert.DoesNotContain("boom", json.RootElement.GetProperty("error").GetProperty("message").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.RootElement.GetProperty("traceId").GetString()));
    }

    private static Action<Microsoft.AspNetCore.Hosting.IWebHostBuilder> Testing => builder => builder
        .UseSetting("Testing", "true")
        .ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> { ["Testing"] = "true", ["Seed:Enabled"] = "false" }));

    private sealed class ThrowingViewerReadService : IViewerReadService
    {
        public Task<IReadOnlyList<Organization>> GetOrganizationsAsync(CancellationToken cancellationToken) => throw new InvalidOperationException("boom");
        public Task<IReadOnlyList<Region>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<Station>> GetStationsAsync(Guid regionId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<Measurement>> GetMeasurementsAsync(Guid stationId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<Alarm>> GetAlarmsAsync(Guid stationId, CancellationToken cancellationToken) => throw new NotImplementedException();
    }
}
