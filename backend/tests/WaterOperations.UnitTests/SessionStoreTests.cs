using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Infrastructure.Authentication;

namespace WaterOperations.UnitTests;

public sealed class SessionStoreTests
{
    private readonly SessionStore store = new();

    [Fact]
    public void Create_ReturnsNonEmptyRefreshTokenToken()
    {
        var user = new AuthenticatedUser("user@test.local", "OrgA", "Reg1", "VIEWER");

        var token = store.Create(user);

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void TryConsume_WithValidToken_SucceedsAndReturnsSession()
    {
        var user = new AuthenticatedUser("user@test.local", "OrgA", "Reg1", "VIEWER");
        var token = store.Create(user);

        var success = store.TryConsume(token, out var session);

        Assert.True(success);
        Assert.NotNull(session);
        Assert.Equal("user@test.local", session.Email);
        Assert.Equal("OrgA", session.Organization);
        Assert.Equal("Reg1", session.Region);
        Assert.Equal("VIEWER", session.Role);
    }

    [Fact]
    public void TryConsume_ConsumedToken_CannotBeReused()
    {
        var user = new AuthenticatedUser("user@test.local", "OrgA", "Reg1", "VIEWER");
        var token = store.Create(user);

        store.TryConsume(token, out _);
        var secondAttempt = store.TryConsume(token, out var session);

        Assert.False(secondAttempt);
        Assert.Null(session);
    }

    [Fact]
    public void Revoke_RemovesToken_AndPreventsConsume()
    {
        var user = new AuthenticatedUser("user@test.local", "OrgA", "Reg1", "VIEWER");
        var token = store.Create(user);

        var revoked = store.Revoke(token);
        var consumeAttempt = store.TryConsume(token, out var session);

        Assert.True(revoked);
        Assert.False(consumeAttempt);
        Assert.Null(session);
    }

    [Fact]
    public void TryConsume_InvalidToken_ReturnsFalse()
    {
        var success = store.TryConsume("non-existent-token", out var session);

        Assert.False(success);
        Assert.Null(session);
    }
}
