using Microsoft.Extensions.Caching.Hybrid;
using WaterOperations.Application.Common.Caching;

namespace WaterOperations.Infrastructure.Caching;

public sealed class HybridCacheService(HybridCache cache) : ICacheService
{
    public ValueTask<T?> GetAsync<T>(
        string key,
        CancellationToken cancellationToken = default) =>
        cache.GetOrCreateAsync<T?>(
            key,
            static _ => new ValueTask<T?>((T?)default),
            cancellationToken: cancellationToken);

    public ValueTask SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        CancellationToken cancellationToken = default) =>
        cache.SetAsync(
            key,
            value,
            new HybridCacheEntryOptions
            {
                Expiration = expiration
            },
            cancellationToken: cancellationToken);

    public ValueTask RemoveAsync(
        string key,
        CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(key, cancellationToken);
}
