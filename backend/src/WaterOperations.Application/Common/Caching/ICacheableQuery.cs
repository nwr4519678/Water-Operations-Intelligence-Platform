using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Application.Common.Caching;

/// <summary>
/// Interface enabling dynamic response caching via MediatR pipeline behavior.
/// Queries implementing this interface will automatically check <see cref="ICacheService"/>
/// before executing and cache the resulting response.
/// </summary>
public interface ICacheableQuery
{
    /// <summary>
    /// Generates a unique cache key for the query given the active user context.
    /// </summary>
    string GetCacheKey(ICurrentUser currentUser);

    /// <summary>
    /// Optional custom cache duration. Defaults to 5 minutes if null.
    /// </summary>
    TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}
