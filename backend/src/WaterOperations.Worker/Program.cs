using Microsoft.Extensions.Hosting;
using WaterOperations.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration["Worker:Enabled"] = "true";
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<WorkerHeartbeat>();
builder.Services.AddHostedService<WaterOperations.Infrastructure.Jobs.OutboxDispatcher>();
await builder.Build().RunAsync();

internal sealed class WorkerHeartbeat(ILogger<WorkerHeartbeat> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Water Operations worker boundary started");
        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
    }
}
