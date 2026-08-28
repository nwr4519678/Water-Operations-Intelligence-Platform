using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Infrastructure.Authentication;

public sealed class DatabaseUserStore(
    IServiceScopeFactory scopeFactory,
    ILogger<DatabaseUserStore> logger)
    : IUserCredentialRepository
{
    private static readonly Action<ILogger, string, Exception?> AccountLockedLog =
        LoggerMessage.Define<string>(
            LogLevel.Warning,
            new EventId(1001, nameof(AccountLockedLog)),
            "Account for '{Email}' is temporarily locked out due to multiple failed login attempts.");

    private readonly PasswordHasher<User> passwordHasher = new();
    private readonly ConcurrentDictionary<string, (int Attempts, DateTimeOffset LockedUntil)> failures =
        new(StringComparer.OrdinalIgnoreCase);

    public AuthenticatedUser? Authenticate(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        if (failures.TryGetValue(request.Email, out var state)
            && state.LockedUntil > DateTimeOffset.UtcNow)
        {
            AccountLockedLog(logger, request.Email, null);
            return null;
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();

        var user = db.Users
            .AsNoTracking()
            .Include(u => u.UserRoleUsers)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefault(u => EF.Functions.ILike(u.Email, request.Email));

        if (user is null || !user.IsActive)
        {
            RecordFailure(request.Email);
            return null;
        }

        bool passwordValid = false;

        // 1. Verify standard ASP.NET Identity PasswordHash (Argon2 / PBKDF2 / Identity V3)
        if (!string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            try
            {
                var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
                if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    passwordValid = true;
                }
            }
            catch
            {
                // Fallthrough to direct comparison if hash format differs
            }

            // 2. Direct comparison for seed/demo data credentials
            if (!passwordValid)
            {
                var suppliedBytes = Encoding.UTF8.GetBytes(request.Password);
                var storedBytes = Encoding.UTF8.GetBytes(user.PasswordHash);
                if (suppliedBytes.Length == storedBytes.Length && CryptographicOperations.FixedTimeEquals(suppliedBytes, storedBytes))
                {
                    passwordValid = true;
                }
            }
        }

        if (!passwordValid)
        {
            RecordFailure(request.Email);
            return null;
        }

        failures.TryRemove(request.Email, out _);

        var roleCode = user.UserRoleUsers.FirstOrDefault()?.Role?.Code
            ?? AuthorizationPolicies.ViewerRole;

        return new AuthenticatedUser(
            user.Email,
            user.OrganizationId.ToString(),
            "1",
            roleCode);
    }

    private void RecordFailure(string email)
    {
        failures.AddOrUpdate(email, _ => (1, DateTimeOffset.MinValue), (_, current) =>
        {
            var attempts = current.Attempts + 1;
            return (attempts, attempts >= 5
                ? DateTimeOffset.UtcNow.AddMinutes(15)
                : DateTimeOffset.MinValue);
        });
    }
}
