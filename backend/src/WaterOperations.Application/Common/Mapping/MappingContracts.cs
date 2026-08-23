using AutoMapper;
using AutoMapper.QueryableExtensions;
using WaterOperations.Application.Common.Pagination;

namespace WaterOperations.Application.Common.Mapping;

// ──────────────────────────────────────────────────────────────────────────────
// Mapping Contracts
// ──────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Marker interface for convention-based AutoMapper registration.
/// Implement on a DTO to auto-register: <c>CreateMap&lt;TSource, TDtoType&gt;()</c>.
/// Override <see cref="Mapping"/> to add custom member-level configuration.
/// </summary>
/// <typeparam name="TSource">Source entity or domain model type.</typeparam>
public interface IMapFrom<TSource>
{
    void Mapping(Profile profile) => profile.CreateMap(typeof(TSource), GetType());
}

/// <summary>
/// Marker interface for convention-based AutoMapper registration.
/// Implement on a source type to auto-register: <c>CreateMap&lt;TSourceType, TTarget&gt;()</c>.
/// Override <see cref="Mapping"/> to add custom member-level configuration.
/// </summary>
/// <typeparam name="TTarget">Destination mapping type.</typeparam>
public interface IMapTo<TTarget>
{
    void Mapping(Profile profile) => profile.CreateMap(GetType(), typeof(TTarget));
}

// ──────────────────────────────────────────────────────────────────────────────
// Mapping Extensions
// ──────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Extension methods for AutoMapper projection, list mapping, and paged result helpers.
/// </summary>
public static class MappingExtensions
{
    /// <summary>
    /// Projects an <see cref="IQueryable{TSource}"/> to the destination type using AutoMapper.
    /// </summary>
    public static IQueryable<TDestination> ProjectToDto<TSource, TDestination>(
        this IQueryable<TSource> source,
        IConfigurationProvider configuration)
        where TDestination : class =>
        source.ProjectTo<TDestination>(configuration);

    /// <summary>
    /// Maps a collection of <typeparamref name="TSource"/> to a read-only list of
    /// <typeparamref name="TDestination"/> using AutoMapper.
    /// </summary>
    public static IReadOnlyList<TDestination> MapList<TSource, TDestination>(
        this IMapper mapper,
        IEnumerable<TSource> source) =>
        mapper.Map<IReadOnlyList<TDestination>>(source);

    /// <summary>
    /// Maps a <see cref="PagedResult{TSource}"/> to a <see cref="PagedResult{TDestination}"/>
    /// by mapping its items and preserving pagination metadata.
    /// </summary>
    public static PagedResult<TDestination> MapPaged<TSource, TDestination>(
        this IMapper mapper,
        PagedResult<TSource> source) =>
        new(
            mapper.Map<IReadOnlyList<TDestination>>(source.Data),
            source.Total,
            source.Page,
            source.PageSize);
}
