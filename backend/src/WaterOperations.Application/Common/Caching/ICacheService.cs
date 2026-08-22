namespace WaterOperations.Application.Common.Caching;

public interface ICacheService
{
    public ValueTask<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    public ValueTask SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        CancellationToken cancellationToken = default);
    public ValueTask RemoveAsync(string key, CancellationToken cancellationToken = default);
}
