using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace WaterOperations.Infrastructure.Security;

public sealed class SessionStore
{
    private readonly ConcurrentDictionary<string, Session> sessions = new();
    public string Create(string email, string organization, string region)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        sessions[token] = new Session(email, organization, region, DateTimeOffset.UtcNow.AddDays(7));
        return token;
    }
    public bool TryConsume(string token, out Session session)
    {
        if (sessions.TryGetValue(token, out session!) && session.ExpiresAt > DateTimeOffset.UtcNow) return true;
        sessions.TryRemove(token, out _); session = null!; return false;
    }
    public bool Revoke(string token) => sessions.TryRemove(token, out _);
    public sealed record Session(string Email, string Organization, string Region, DateTimeOffset ExpiresAt);
}
