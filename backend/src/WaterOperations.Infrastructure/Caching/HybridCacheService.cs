using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Hybrid;
using WaterOperations.Application.Common.Caching;

namespace WaterOperations.Infrastructure.Caching;

public sealed class HybridCacheService(
    HybridCache cache,
    IDistributedCache distributedCache)
    : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async ValueTask<T?> GetAsync<T>(
        string key,
        CancellationToken cancellationToken = default)
    {
        var bytes = await distributedCache.GetAsync(key, cancellationToken);
        if (bytes is null || bytes.Length == 0)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(bytes, JsonOptions);
        }
        catch
        {
            return default;
        }
    }

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
