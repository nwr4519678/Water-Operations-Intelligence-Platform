using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using WaterOperations.Application.Features.Auth.Interfaces;

namespace WaterOperations.Infrastructure.Authentication;

/// <summary>
/// Thread-safe in-process session store that persists sessions to a local
/// JSON file so they survive application restarts.
/// </summary>
public sealed class SessionStore : IRefreshSessionRepository
{
    private readonly ConcurrentDictionary<string, Session> _sessions;
    private readonly string _persistencePath;
    private static readonly JsonSerializerOptions _jsonOpts =
        new() { WriteIndented = false };

    public SessionStore()
    {
        _persistencePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WaterOperations",
            "sessions.json");

        _sessions = Load();
        PurgeExpired();
    }

    public string Create(AuthenticatedUser user)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        _sessions[Hash(token)] = new(
            user.Email,
            user.Organization,
            user.Region,
            user.Role,
            DateTimeOffset.UtcNow.AddDays(30));   // 30-day rolling sessions
        Save();
        return token;
    }

    public bool TryConsume(string refreshToken, out AuthSession? session)
    {
        if (_sessions.TryRemove(Hash(refreshToken), out var stored)
            && stored.ExpiresAt > DateTimeOffset.UtcNow)
        {
            Save();
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

    public bool Revoke(string refreshToken)
    {
        var removed = _sessions.TryRemove(Hash(refreshToken), out _);
        if (removed) Save();
        return removed;
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));

    private void PurgeExpired()
    {
        var now = DateTimeOffset.UtcNow;
        var expired = _sessions
            .Where(kvp => kvp.Value.ExpiresAt <= now)
            .Select(kvp => kvp.Key)
            .ToList();

        if (expired.Count == 0) return;

        foreach (var key in expired)
            _sessions.TryRemove(key, out _);

        Save();
    }

    private ConcurrentDictionary<string, Session> Load()
    {
        try
        {
            if (!File.Exists(_persistencePath))
                return new ConcurrentDictionary<string, Session>();

            var json = File.ReadAllText(_persistencePath);
            var dict = JsonSerializer.Deserialize<Dictionary<string, Session>>(json, _jsonOpts)
                       ?? [];
            return new ConcurrentDictionary<string, Session>(dict);
        }
        catch
        {
            return new ConcurrentDictionary<string, Session>();
        }
    }

    private void Save()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_persistencePath)!);
            var json = JsonSerializer.Serialize(
                _sessions.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                _jsonOpts);
            File.WriteAllText(_persistencePath, json);
        }
        catch
        {
            // Non-fatal: worst case the session is lost on restart, which is
            // the same behavior as before this persistence layer was added.
        }
    }

    private sealed record Session(
        string Email,
        string Organization,
        string Region,
        string Role,
        DateTimeOffset ExpiresAt);
}
