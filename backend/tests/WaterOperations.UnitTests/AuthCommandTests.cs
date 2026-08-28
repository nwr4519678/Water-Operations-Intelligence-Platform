using WaterOperations.Application.Features.Auth.Commands;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Auth.Interfaces;

namespace WaterOperations.UnitTests;

public sealed class AuthCommandTests
{
    private readonly FakeCredentials credentials = new();
    private readonly FakeSessions sessions = new();
    private readonly FakeTokens tokens = new();

    [Fact]
    public async Task LoginCommandHandler_ValidCredentials_ReturnsAuthResponse()
    {
        var handler = new LoginCommandHandler(credentials, sessions, tokens);
        var request = new LoginRequest("viewer@water.local", "correct-password");

        var result = await handler.Handle(new LoginCommand(request), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("jwt-token-viewer@water.local", result.AccessToken);
        Assert.Equal("refresh-token-viewer@water.local", result.RefreshToken);
        Assert.Equal(900, result.ExpiresIn);
    }

    [Fact]
    public async Task LoginCommandHandler_InvalidCredentials_ReturnsNull()
    {
        var handler = new LoginCommandHandler(credentials, sessions, tokens);
        var request = new LoginRequest("viewer@water.local", "wrong-password");

        var result = await handler.Handle(new LoginCommand(request), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task LogoutCommandHandler_DelegatesToSessionRevoke()
    {
        var handler = new LogoutCommandHandler(sessions);

        var result = await handler.Handle(new LogoutCommand("active-session-token"), CancellationToken.None);

        Assert.True(result);
        Assert.Equal("active-session-token", sessions.LastRevokedToken);
    }

    [Fact]
    public async Task RefreshCommandHandler_ValidSession_IssuesNewTokens()
    {
        var handler = new RefreshCommandHandler(sessions, tokens);

        var result = await handler.Handle(new RefreshCommand("valid-refresh-token"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("jwt-token-refreshed@water.local", result.AccessToken);
        Assert.Equal("refresh-token-refreshed@water.local", result.RefreshToken);
    }

    [Fact]
    public async Task RefreshCommandHandler_InvalidOrExpiredSession_ReturnsNull()
    {
        var handler = new RefreshCommandHandler(sessions, tokens);

        var result = await handler.Handle(new RefreshCommand("invalid-refresh-token"), CancellationToken.None);

        Assert.Null(result);
    }

    private sealed class FakeCredentials : IUserCredentialRepository
    {
        public AuthenticatedUser? Authenticate(LoginRequest request)
        {
            if (request.Email == "viewer@water.local" && request.Password == "correct-password")
            {
                return new AuthenticatedUser("viewer@water.local", "Org1", "Reg1", "VIEWER");
            }
            return null;
        }
    }

    private sealed class FakeSessions : IRefreshSessionRepository
    {
        public string? LastRevokedToken { get; private set; }

        public string Create(AuthenticatedUser user) => $"refresh-token-{user.Email}";

        public bool TryConsume(string refreshToken, out AuthSession? session)
        {
            if (refreshToken == "valid-refresh-token")
            {
                session = new AuthSession("refreshed@water.local", "Org1", "Reg1", "VIEWER");
                return true;
            }
            session = null;
            return false;
        }

        public bool Revoke(string refreshToken)
        {
            LastRevokedToken = refreshToken;
            return true;
        }
    }

    private sealed class FakeTokens : IAccessTokenIssuer
    {
        public string Create(AuthenticatedUser user) => $"jwt-token-{user.Email}";
    }
}
