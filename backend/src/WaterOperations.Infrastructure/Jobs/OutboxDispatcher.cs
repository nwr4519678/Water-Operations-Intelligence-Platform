using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class OutboxDispatcher(IServiceScopeFactory scopeFactory, IConnectionMultiplexer redis, ILogger<OutboxDispatcher> logger) : BackgroundService
{
    private const string Channel = "water-operations:integration-events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchBatchAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Outbox dispatch cycle failed");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task DispatchBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
        var jobs = scope.ServiceProvider.GetRequiredService<IJobExecutionStore>();
        var now = DateTime.UtcNow;
        var messages = await db.OutboxMessages.Where(x => (x.Status == "PENDING" || x.Status == "RETRY_WAIT") && x.AvailableAtUtc <= now)
            .OrderBy(x => x.OccurredAtUtc).Take(50).ToListAsync(cancellationToken);
        foreach (var message in messages)
        {
            var key = $"outbox:{message.OutboxMessageId:N}";
            if (!await jobs.TryStartAsync(key, "OUTBOX_DISPATCH", TimeSpan.FromMinutes(2), cancellationToken)) continue;
            try
            {
                message.Status = "PROCESSING";
                await db.SaveChangesAsync(cancellationToken);
                var envelope = JsonSerializer.Serialize(new { message.OutboxMessageId, message.OrganizationId, message.EventType, message.PayloadJson, message.OccurredAtUtc });
                await redis.GetSubscriber().PublishAsync(RedisChannel.Literal(Channel), envelope);
                message.Status = "PROCESSED";
                message.ProcessedAtUtc = DateTime.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
                await jobs.CompleteAsync(key, cancellationToken);
            }
            catch (Exception exception)
            {
                message.Status = "RETRY_WAIT";
                message.AttemptCount++;
                message.AvailableAtUtc = DateTime.UtcNow.AddSeconds(Math.Min(300, Math.Pow(2, message.AttemptCount)));
                message.LastError = exception.Message[..Math.Min(4000, exception.Message.Length)];
                await db.SaveChangesAsync(cancellationToken);
                await jobs.FailAsync(key, exception.Message, TimeSpan.FromMinutes(1), message.AttemptCount >= 10, cancellationToken);
            }
        }
    }
}
