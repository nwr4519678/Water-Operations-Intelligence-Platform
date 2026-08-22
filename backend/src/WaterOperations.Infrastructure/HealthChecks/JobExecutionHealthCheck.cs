using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.HealthChecks;

public sealed class JobExecutionHealthCheck(WaterOperationsDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var deadLetters = await db.JobExecutions.CountAsync(x => x.Status == "DEAD_LETTER", cancellationToken);
        var expiredRunning = await db.JobExecutions.CountAsync(x => x.Status == "RUNNING" && x.ExpiresAtUtc < now, cancellationToken);
        if (deadLetters > 0) return HealthCheckResult.Unhealthy($"{deadLetters} job(s) are dead-lettered.", data: new Dictionary<string, object> { ["deadLettered"] = deadLetters, ["expiredRunning"] = expiredRunning });
        if (expiredRunning > 0) return HealthCheckResult.Degraded($"{expiredRunning} job lease(s) expired.", data: new Dictionary<string, object> { ["deadLettered"] = deadLetters, ["expiredRunning"] = expiredRunning });
        return HealthCheckResult.Healthy("Durable job execution state is healthy.", new Dictionary<string, object> { ["deadLettered"] = deadLetters, ["expiredRunning"] = expiredRunning });
    }
}
