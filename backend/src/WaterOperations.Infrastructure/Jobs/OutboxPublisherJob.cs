using System.Text.Json;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class OutboxPublisherJob(WaterOperationsDbContext db, ILogger<OutboxPublisherJob> logger)
{
    private static readonly Action<ILogger, Guid, int, Exception?> OutboxMessagePublishFailed =
        LoggerMessage.Define<Guid, int>(
            LogLevel.Error,
            new EventId(1001, nameof(OutboxMessagePublishFailed)),
            "Outbox message {MessageId} failed on attempt {Attempt}");

    [AutomaticRetry(Attempts = 5, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
    public async Task PublishAsync(CancellationToken cancellationToken = default)
    {
        var messages = await db.OutboxMessages.Where(x => x.ProcessedAtUtc == null && x.AttemptCount < 10)
            .OrderBy(x => x.OccurredAtUtc).Take(100).ToListAsync(cancellationToken);
        foreach (var message in messages)
        {
            try
            {
                _ = JsonDocument.Parse(message.PayloadJson);
                message.AttemptCount++;
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.LastError = string.Empty;
            }
            catch (Exception exception)
            {
                message.AttemptCount++;
                message.FailedAtUtc = DateTime.UtcNow;
                message.LastError = exception.Message[..Math.Min(exception.Message.Length, 4000)];
                OutboxMessagePublishFailed(
                    logger,
                    message.OutboxMessageId,
                    message.AttemptCount,
                    exception);
            }
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
