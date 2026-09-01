using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WaterOperations.Infrastructure.Configuration;

namespace WaterOperations.Infrastructure.Dahiti;

public sealed class DahitiSyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<DahitiOptions> options,
    ILogger<DahitiSyncHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(Math.Clamp(options.Value.SyncIntervalMinutes, 5, 1440)));
        await RunOnceAsync(stoppingToken);
        while (await timer.WaitForNextTickAsync(stoppingToken)) await RunOnceAsync(stoppingToken);
    }

    private async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<DahitiSyncService>().SyncAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception exception) { logger.LogError(exception, "DaHITI background sync run failed."); }
    }
}
