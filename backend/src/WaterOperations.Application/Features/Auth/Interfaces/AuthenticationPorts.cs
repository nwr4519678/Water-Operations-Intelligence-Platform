using WaterOperations.Application.Features.Auth.DTOs;

namespace WaterOperations.Application.Features.Auth.Interfaces;

public sealed record AuthenticatedUser(
    string Email,
    string Organization,
    string Region,
    string Role);

public sealed record AuthSession(
    string Email,
    string Organization,
    string Region,
    string Role);

public interface IUserCredentialRepository
{
    AuthenticatedUser? Authenticate(LoginRequest request);
}

public interface IRefreshSessionRepository
{
    string Create(AuthenticatedUser user);

    bool TryConsume(string refreshToken, out AuthSession? session);

    bool Revoke(string refreshToken);
}

public interface IAccessTokenIssuer
{
    string Create(AuthenticatedUser user);
}
