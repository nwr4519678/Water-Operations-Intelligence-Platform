using WaterOperations.Application.Common.Pagination;

namespace WaterOperations.UnitTests;

public sealed class PaginationTests
{
    [Fact]
    public void PaginationRequest_DefaultConstructor_SetsDefaultPageAndPageSize()
    {
        var request = new PaginationRequest();

        Assert.Equal(1, request.Page);
        Assert.Equal(50, request.PageSize);
    }

    [Fact]
    public void PaginationRequest_NegativeOrZeroPage_ClampsToOne()
    {
        var requestNegative = new PaginationRequest(-5, 20);
        var requestZero = new PaginationRequest(0, 20);

        Assert.Equal(1, requestNegative.Page);
        Assert.Equal(1, requestZero.Page);
    }

    [Fact]
    public void PaginationRequest_InvalidPageSize_ClampsBetween1And500()
    {
        var requestZero = new PaginationRequest(1, 0);
        var requestExcessive = new PaginationRequest(1, 1000);

        Assert.Equal(1, requestZero.PageSize);
        Assert.Equal(500, requestExcessive.PageSize);
    }

    [Fact]
    public void PagedResult_CalculatesTotalPagesAndHasNextPreviousFlagsCorrectly()
    {
        var items = new List<string> { "item1", "item2" };
        var paged = new PagedResult<string>(items, Total: 25, Page: 2, PageSize: 10);

        Assert.Equal(2, paged.Page);
        Assert.Equal(10, paged.PageSize);
        Assert.Equal(25, paged.Total);
        Assert.Equal(3, paged.TotalPages);
        Assert.True(paged.HasPreviousPage);
        Assert.True(paged.HasNextPage);
    }
}
