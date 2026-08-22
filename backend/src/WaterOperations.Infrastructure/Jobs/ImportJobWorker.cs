using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WaterOperations.Application.Features.Telemetry.Interfaces;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class ImportJobWorker(ImportJobQueue queue, IServiceScopeFactory scopeFactory, ILogger<ImportJobWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var item in queue.ReadAllAsync(stoppingToken))
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var jobs = scope.ServiceProvider.GetRequiredService<IJobExecutionStore>();
            if (!await jobs.TryStartAsync(item.JobKey, "BULK_IMPORT", TimeSpan.FromMinutes(30), stoppingToken)) continue;
            try
            {
                await scope.ServiceProvider.GetRequiredService<IMeasurementIngestionService>().IngestAsync(item.Request, stoppingToken);
                await jobs.CompleteAsync(item.JobKey, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception exception)
            {
                logger.LogError(exception, "Bulk import job {JobKey} failed", item.JobKey);
                await jobs.FailAsync(item.JobKey, exception.Message, TimeSpan.FromMinutes(5), false, stoppingToken);
            }
        }
    }
}
