using System.Collections.Concurrent;
using System.Security.Cryptography;
using WaterOperations.Application.Features.Auth.Interfaces;

namespace WaterOperations.Infrastructure.Authentication;

public sealed class SessionStore : IRefreshSessionRepository
{
    private readonly ConcurrentDictionary<string, Session> sessions = new();

    public string Create(AuthenticatedUser user)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        sessions[Hash(token)] = new(
            user.Email,
            user.Organization,
            user.Region,
            user.Role,
            DateTimeOffset.UtcNow.AddDays(7));
        return token;
    }

    public bool TryConsume(string refreshToken, out AuthSession? session)
    {
        if (sessions.TryRemove(Hash(refreshToken), out var stored)
            && stored.ExpiresAt > DateTimeOffset.UtcNow)
        {
            session = new AuthSession(
                stored.Email,
                stored.Organization,
                stored.Region,
                stored.Role);
            return true;
        }

        session = null;
        return false;
    }

    public bool Revoke(string refreshToken) => sessions.TryRemove(Hash(refreshToken), out _);

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));

    private sealed record Session(
        string Email,
        string Organization,
        string Region,
        string Role,
        DateTimeOffset ExpiresAt);
}
