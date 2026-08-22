namespace WaterOperations.Application.Common.Pagination;

public sealed record PagedResult<T>(
    IReadOnlyList<T> Data,
    int Page,
    int PageSize,
    int Total);
