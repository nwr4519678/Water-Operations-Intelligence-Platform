using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;

namespace WaterOperations.Application.Common.Behaviors;

/// <summary>
/// MediatR pipeline behavior that transparently caches query results
/// for requests implementing <see cref="ICacheableQuery"/>.
/// </summary>
public sealed class QueryCachingBehavior<TRequest, TResponse>(
    ICacheService cacheService,
    ICurrentUser currentUser)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICacheableQuery
{
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(5);

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var cacheKey = request.GetCacheKey(currentUser);
        if (string.IsNullOrWhiteSpace(cacheKey))
        {
            return await next(cancellationToken);
        }

        var cachedResponse = await cacheService.GetAsync<TResponse>(cacheKey, cancellationToken);
        if (cachedResponse is not null)
        {
            return cachedResponse;
        }

        var response = await next(cancellationToken);

        if (response is not null)
        {
            var expiration = request.Expiration ?? DefaultExpiration;
            await cacheService.SetAsync(cacheKey, response, expiration, cancellationToken);
        }

        return response;
    }
}
