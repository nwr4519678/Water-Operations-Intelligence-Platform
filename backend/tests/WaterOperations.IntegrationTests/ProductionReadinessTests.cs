using System.Data;
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;
using WaterOperations.Api;

namespace WaterOperations.IntegrationTests;

public sealed class ProductionReadinessTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;

    public ProductionReadinessTests(WebApplicationFactory<Program> factory) => this.factory = factory;

    [Fact]
    public async Task SwaggerContractIsAvailableAndMetricsRequireAuthorization()
    {
        using var client = factory.WithWebHostBuilder(builder => builder.UseSetting("Testing", "true")).CreateClient();

        using var swagger = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, swagger.StatusCode);
        Assert.Contains("\"openapi\"", await swagger.Content.ReadAsStringAsync());

        using var metrics = await client.GetAsync("/metrics");
        Assert.Equal(HttpStatusCode.Unauthorized, metrics.StatusCode);
    }

    [Fact]
    public async Task ConfiguredPostgreSqlIsReachable()
    {
        var connectionString = Environment.GetEnvironmentVariable("INTEGRATION_POSTGRES_CONNECTION");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return;
        }

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        Assert.Equal(ConnectionState.Open, connection.State);
        await using var command = new NpgsqlCommand("select 1", connection);
        Assert.Equal(1, await command.ExecuteScalarAsync());
    }
}
