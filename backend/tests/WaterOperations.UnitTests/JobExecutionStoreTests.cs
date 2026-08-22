using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.UnitTests;

public sealed class JobExecutionStoreTests
{
    [Fact]
    public async Task RetryBackoffPreventsEarlyDuplicateAndAllowsLaterRecovery()
    {
        await using var db = CreateContext();
        var store = new EfJobExecutionStore(db);

        Assert.True(await store.TryStartAsync("job-1", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        await store.FailAsync("job-1", "temporary", TimeSpan.FromMinutes(5), false, CancellationToken.None);

        Assert.False(await store.TryStartAsync("job-1", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        var execution = await db.JobExecutions.SingleAsync(x => x.JobKey == "job-1");
        execution.AvailableAtUtc = DateTime.UtcNow.AddSeconds(-1);
        await db.SaveChangesAsync();

        Assert.True(await store.TryStartAsync("job-1", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
    }

    [Fact]
    public async Task DeadLetterAndCompletedJobsCannotBeStartedAgain()
    {
        await using var db = CreateContext();
        var store = new EfJobExecutionStore(db);

        Assert.True(await store.TryStartAsync("dead", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        await store.FailAsync("dead", "permanent", TimeSpan.Zero, true, CancellationToken.None);
        Assert.False(await store.TryStartAsync("dead", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));

        Assert.True(await store.TryStartAsync("done", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        await store.CompleteAsync("done", CancellationToken.None);
        Assert.False(await store.TryStartAsync("done", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
    }

    [Fact]
    public async Task CancelledJobsCannotBeRestarted()
    {
        await using var db = CreateContext();
        var store = new EfJobExecutionStore(db);

        Assert.True(await store.TryStartAsync("cancelled", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        await store.CancelAsync("cancelled", "operator_requested", CancellationToken.None);

        Assert.False(await store.TryStartAsync("cancelled", "TEST", TimeSpan.FromMinutes(1), CancellationToken.None));
        Assert.Equal("CANCELLED", (await db.JobExecutions.SingleAsync(x => x.JobKey == "cancelled")).Status);
    }

    private static WaterOperationsDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<WaterOperationsDbContext>()
            .UseInMemoryDatabase($"job-tests-{Guid.NewGuid():N}")
            .Options);
}
