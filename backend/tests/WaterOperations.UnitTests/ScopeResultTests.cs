using WaterOperations.Application.Common.Results;

namespace WaterOperations.UnitTests;

public sealed class ScopeResultTests
{
    [Fact]
    public void Authorized_SetsIsAuthorizedTrue_AndIsNotFoundFalse()
    {
        var result = ScopeResult.Authorized("test-value");

        Assert.True(result.IsAuthorized);
        Assert.False(result.IsNotFound);
        Assert.Equal("test-value", result.Value);
    }

    [Fact]
    public void NotFound_SetsIsAuthorizedFalse_AndIsNotFoundTrue()
    {
        var result = ScopeResult.NotFound<string>();

        Assert.False(result.IsAuthorized);
        Assert.True(result.IsNotFound);
        Assert.Null(result.Value);
    }

    [Fact]
    public void Forbidden_SetsIsAuthorizedFalse_AndIsNotFoundFalse()
    {
        var result = ScopeResult.Forbidden<string>();

        Assert.False(result.IsAuthorized);
        Assert.False(result.IsNotFound);
        Assert.Null(result.Value);
    }
}
