namespace WaterOperations.Application.Common.Pagination;

public sealed record PaginationRequest(int Page = 1, int PageSize = 50);
