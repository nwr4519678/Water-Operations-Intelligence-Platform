using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace WaterOperations.Infrastructure.HealthChecks;

public sealed class RedisReadinessCheck(IServiceProvider serviceProvider) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var redis = serviceProvider.GetService<IConnectionMultiplexer>();
            if (redis is null)
            {
                return HealthCheckResult.Healthy("Redis is disabled.");
            }

            await redis.GetDatabase().PingAsync();
            return HealthCheckResult.Healthy("Redis is reachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Redis readiness check failed.", exception);
        }
    }
}
