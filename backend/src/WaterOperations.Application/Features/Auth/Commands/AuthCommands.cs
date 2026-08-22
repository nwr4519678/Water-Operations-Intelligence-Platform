using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Auth.Interfaces;

namespace WaterOperations.Application.Features.Auth.Commands;

public sealed record LoginCommand(LoginRequest Request) : ICommand<AuthResponse?>;

public sealed record LogoutCommand(string RefreshToken) : ICommand<bool>;

public sealed record RefreshCommand(string RefreshToken) : ICommand<AuthResponse?>;

public sealed class LoginCommandHandler(
    IUserCredentialRepository credentials,
    IRefreshSessionRepository sessions,
    IAccessTokenIssuer tokens)
    : ICommandHandler<LoginCommand, AuthResponse?>
{
    public Task<AuthResponse?> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var user = credentials.Authenticate(request.Request);
        return Task.FromResult(
            user is null
                ? null
                : Issue(user));
    }

    private AuthResponse Issue(AuthenticatedUser user) =>
        new(
            tokens.Create(user),
            sessions.Create(user),
            900);
}

public sealed class LogoutCommandHandler(IRefreshSessionRepository sessions)
    : ICommandHandler<LogoutCommand, bool>
{
    public Task<bool> Handle(
        LogoutCommand request,
        CancellationToken cancellationToken) =>
        Task.FromResult(sessions.Revoke(request.RefreshToken));
}

public sealed class RefreshCommandHandler(
    IRefreshSessionRepository sessions,
    IAccessTokenIssuer tokens)
    : ICommandHandler<RefreshCommand, AuthResponse?>
{
    public Task<AuthResponse?> Handle(
        RefreshCommand request,
        CancellationToken cancellationToken)
    {
        if (!sessions.TryConsume(request.RefreshToken, out var session)
            || session is null)
        {
            return Task.FromResult<AuthResponse?>(null);
        }

        var user = new AuthenticatedUser(
            session.Email,
            session.Organization,
            session.Region,
            session.Role);
        return Task.FromResult<AuthResponse?>(
            new(
                tokens.Create(user),
                sessions.Create(user),
                900));
    }
}
