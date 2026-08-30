using WaterOperations.Domain.Common.Primitives;
using WaterOperations.Domain.Common.Results;

namespace WaterOperations.UnitTests;

public sealed class ResultAndDomainPrimitivesTests
{
    private sealed class TestEntity : Entity
    {
        public void Update() => Touch();
    }

    [Fact]
    public void Entity_NewInstance_InitializesIdAndTimestamps()
    {
        var entity = new TestEntity();

        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.True(entity.CreatedAt <= DateTimeOffset.UtcNow);
        Assert.True(entity.UpdatedAt <= DateTimeOffset.UtcNow);
    }

    [Fact]
    public void Entity_Touch_UpdatesUpdatedAtTimestamp()
    {
        var entity = new TestEntity();
        var initialUpdate = entity.UpdatedAt;

        Thread.Sleep(10);
        entity.Update();

        Assert.True(entity.UpdatedAt > initialUpdate);
    }

    [Fact]
    public void Result_Success_CreatesValidResult()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Result_Failure_CreatesFailedResultWithError()
    {
        var result = Result.Failure("INVALID_STATE");

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal("INVALID_STATE", result.Error);
    }

    [Fact]
    public void ResultT_Success_ContainsValue()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void ResultT_Failure_ContainsErrorWithoutValue()
    {
        var result = Result.Failure<int>("ERR_CODE");

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal("ERR_CODE", result.Error);
    }
}
