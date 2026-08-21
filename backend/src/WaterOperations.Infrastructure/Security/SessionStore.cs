using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Security;

public sealed class SessionStore(WaterOperationsDbContext db, IConfiguration configuration)
{
    private readonly ConcurrentDictionary<string, Session> sessions = new();
    public async Task<string> CreateAsync(ViewerUser user, CancellationToken cancellationToken = default)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        if (user.UserId is null || configuration["Testing"] == "true")
        {
            sessions[token] = new Session(user.Email, user.Organization, user.Region, user.Role, DateTimeOffset.UtcNow.AddDays(7));
            return token;
        }

        db.Sessions.Add(new Domain.Entities.Session
        {
            UserId = user.UserId.Value,
            RefreshTokenHash = Hash(token),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7)
        });
        await db.SaveChangesAsync(cancellationToken);
        return token;
    }
    public async Task<(bool Success, Session? Value)> TryConsumeAsync(string token, CancellationToken cancellationToken = default)
    {
        if (configuration["Testing"] == "true")
        {
            if (sessions.TryRemove(token, out var memorySession) && memorySession.ExpiresAt > DateTimeOffset.UtcNow) return (true, memorySession);
            return (false, null);
        }

        var stored = await db.Sessions.Include(session => session.User).ThenInclude(user => user.UserRoleUsers).ThenInclude(userRole => userRole.Role).SingleOrDefaultAsync(session => session.RefreshTokenHash == Hash(token), cancellationToken);
        if (stored is null || stored.RevokedAtUtc is not null || stored.ExpiresAtUtc <= DateTime.UtcNow) return (false, null);
        stored.RevokedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        var role = stored.User.UserRoleUsers.Select(userRole => userRole.Role.Code).FirstOrDefault() ?? AuthorizationPolicies.ViewerRole;
        return (true, new Session(stored.User.Email, stored.User.OrganizationId.ToString(), string.Empty, role, stored.ExpiresAtUtc));
    }
    public async Task RevokeAsync(string token, CancellationToken cancellationToken = default)
    {
        if (configuration["Testing"] == "true") { sessions.TryRemove(token, out _); return; }
        var stored = await db.Sessions.SingleOrDefaultAsync(session => session.RefreshTokenHash == Hash(token), cancellationToken);
        if (stored is not null && stored.RevokedAtUtc is null) { stored.RevokedAtUtc = DateTime.UtcNow; await db.SaveChangesAsync(cancellationToken); }
    }
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
    public sealed record Session(string Email, string Organization, string Region, string Role, DateTimeOffset ExpiresAt);
}
