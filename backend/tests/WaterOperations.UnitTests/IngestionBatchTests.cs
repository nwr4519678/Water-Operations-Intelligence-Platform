using WaterOperations.Domain.Entities;

namespace WaterOperations.UnitTests;

public sealed class IngestionBatchTests
{
    [Fact]
    public void CompleteSetsPartialStatusAndCounts()
    {
        var batch = new IngestionBatch();

        var result = batch.Complete(10, 7, DateTime.UtcNow, DateTime.UtcNow);

        Assert.True(result.IsSuccess);
        Assert.Equal("PARTIAL", batch.Status);
        Assert.Equal(3, batch.RejectedRows);
    }

    [Fact]
    public void CompleteRejectsInvalidTotals()
    {
        var batch = new IngestionBatch();

        var result = batch.Complete(3, 4, DateTime.UtcNow, DateTime.UtcNow);

        Assert.False(result.IsSuccess);
        Assert.Equal("invalid_batch_totals", result.Error);
    }
}
