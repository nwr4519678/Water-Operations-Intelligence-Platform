using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class EfJobExecutionStore(WaterOperationsDbContext db) : IJobExecutionStore
{
    public async Task<bool> TryStartAsync(string jobKey, string jobType, TimeSpan timeout, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var existing = await db.JobExecutions.SingleOrDefaultAsync(x => x.JobKey == jobKey, cancellationToken);
        if (existing is not null && (existing.Status == "COMPLETED" || existing.Status == "DEAD_LETTER")) return false;
        if (existing is not null && existing.Status == "RUNNING" && existing.ExpiresAtUtc > now) return false;
        if (existing is not null && existing.Status == "RETRY_WAIT" && existing.AvailableAtUtc > now) return false;
        if (existing is null)
        {
            db.JobExecutions.Add(new JobExecution { JobExecutionId = Guid.NewGuid(), JobKey = jobKey, JobType = jobType, AttemptCount = 1, StartedAtUtc = now, ExpiresAtUtc = now.Add(timeout) });
        }
        else
        {
            existing.Status = "RUNNING";
            existing.AttemptCount++;
            existing.StartedAtUtc = now;
            existing.ExpiresAtUtc = now.Add(timeout);
            existing.AvailableAtUtc = null;
            existing.LastError = null;
        }
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task CompleteAsync(string jobKey, CancellationToken cancellationToken)
    {
        var job = await db.JobExecutions.SingleAsync(x => x.JobKey == jobKey, cancellationToken);
        job.Status = "COMPLETED";
        job.CompletedAtUtc = DateTime.UtcNow;
        job.ExpiresAtUtc = null;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task FailAsync(string jobKey, string error, TimeSpan retryAfter, bool deadLetter, CancellationToken cancellationToken)
    {
        var job = await db.JobExecutions.SingleAsync(x => x.JobKey == jobKey, cancellationToken);
        job.Status = deadLetter ? "DEAD_LETTER" : "RETRY_WAIT";
        job.LastError = error.Length > 4000 ? error[..4000] : error;
        job.AvailableAtUtc = DateTime.UtcNow.Add(retryAfter);
        job.ExpiresAtUtc = null;
        await db.SaveChangesAsync(cancellationToken);
    }
}
