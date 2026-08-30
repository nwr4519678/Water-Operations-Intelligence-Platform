namespace WaterOperations.Application.Common.Pagination;

/// <summary>
/// Container record for paginated query response data.
/// </summary>
/// <typeparam name="T">Element type of the paged list.</typeparam>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Data,
    int Total,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / Math.Max(1, PageSize));

    public bool HasPreviousPage => Page > 1;

    public bool HasNextPage => Page < TotalPages;
}
