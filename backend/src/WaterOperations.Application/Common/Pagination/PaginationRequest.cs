namespace WaterOperations.Application.Common.Pagination;

/// <summary>
/// Query pagination request parameters with automatic clamping boundaries.
/// </summary>
public sealed record PaginationRequest
{
    private readonly int page = 1;
    private readonly int pageSize = 50;

    /// <summary>1-indexed page number (min: 1).</summary>
    public int Page
    {
        get => page;
        init => page = Math.Max(1, value);
    }

    /// <summary>Page size limit (min: 1, max: 500).</summary>
    public int PageSize
    {
        get => pageSize;
        init => pageSize = Math.Clamp(value, 1, 500);
    }

    public PaginationRequest() { }

    public PaginationRequest(int page, int pageSize)
    {
        Page = page;
        PageSize = pageSize;
    }
}
