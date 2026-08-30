namespace WaterOperations.Infrastructure.AI;

/// <summary>Process-local circuit breaker for the optional AI service.</summary>
public sealed class AiModelCircuitBreaker
{
    private readonly object gate = new();
    private int failures;
    private DateTimeOffset? openUntilUtc;

    public bool IsOpen(DateTimeOffset now)
    {
        lock (gate)
        {
            return openUntilUtc is { } openUntil && openUntil > now;
        }
    }

    public void RecordSuccess()
    {
        lock (gate)
        {
            failures = 0;
            openUntilUtc = null;
        }
    }

    public void RecordFailure(int threshold, TimeSpan breakDuration, DateTimeOffset now)
    {
        lock (gate)
        {
            failures++;
            if (failures >= Math.Max(1, threshold))
            {
                openUntilUtc = now.Add(breakDuration);
                failures = 0;
            }
        }
    }
}
