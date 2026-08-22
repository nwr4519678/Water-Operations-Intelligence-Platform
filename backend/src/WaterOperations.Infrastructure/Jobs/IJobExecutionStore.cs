namespace WaterOperations.Infrastructure.Jobs;

public interface IJobExecutionStore
{
    Task<bool> TryStartAsync(string jobKey, string jobType, TimeSpan timeout, CancellationToken cancellationToken);
    Task CompleteAsync(string jobKey, CancellationToken cancellationToken);
    Task FailAsync(string jobKey, string error, TimeSpan retryAfter, bool deadLetter, CancellationToken cancellationToken);
    Task CancelAsync(string jobKey, string reason, CancellationToken cancellationToken);
}
