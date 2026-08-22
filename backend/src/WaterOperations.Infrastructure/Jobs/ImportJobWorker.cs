using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class ImportJobWorker(IServiceScopeFactory scopeFactory, ILogger<ImportJobWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
            var staleBefore = DateTime.UtcNow.AddMinutes(-30);
            var stored = await db.ImportJobs.Where(x => x.Status == "QUEUED" || (x.Status == "RUNNING" && x.StartedAtUtc < staleBefore)).OrderBy(x => x.CreatedAtUtc).FirstOrDefaultAsync(stoppingToken);
            if (stored is null) { await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken); continue; }
            stored.Status = "RUNNING"; stored.ProgressPercent = 0; stored.StartedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(stoppingToken);
            var request = JsonSerializer.Deserialize<WaterOperations.Application.Features.Telemetry.DTOs.IngestionBatchRequest>(stored.RequestJson)
                ?? throw new InvalidOperationException("Stored import request is invalid.");
            var jobKey = $"import:{stored.ImportJobId:N}";
            var jobs = scope.ServiceProvider.GetRequiredService<IJobExecutionStore>();
            if (!await jobs.TryStartAsync(jobKey, "BULK_IMPORT", TimeSpan.FromMinutes(30), stoppingToken)) continue;
            try
            {
                await scope.ServiceProvider.GetRequiredService<IMeasurementIngestionService>().IngestAsync(request, stoppingToken);
                await jobs.CompleteAsync(jobKey, stoppingToken);
                stored.Status = "COMPLETED"; stored.ProgressPercent = 100; stored.CompletedAtUtc = DateTime.UtcNow;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception exception)
            {
                logger.LogError(exception, "Bulk import job {JobKey} failed", jobKey);
                await jobs.FailAsync(jobKey, exception.Message, TimeSpan.FromMinutes(5), false, stoppingToken);
                stored.Status = "FAILED"; stored.ProgressPercent = 0; stored.LastError = exception.Message[..Math.Min(4000, exception.Message.Length)];
            }
            await db.SaveChangesAsync(stoppingToken);
        }
    }
}
