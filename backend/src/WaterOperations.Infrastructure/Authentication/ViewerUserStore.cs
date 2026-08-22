using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Infrastructure.Authentication;

public sealed class ViewerUserStore(IConfiguration configuration) : IUserCredentialRepository
{
    private readonly ConcurrentDictionary<string, (int Attempts, DateTimeOffset LockedUntil)> failures =
        new(StringComparer.OrdinalIgnoreCase);

    public AuthenticatedUser? Authenticate(LoginRequest request)
    {
        if (failures.TryGetValue(request.Email, out var state)
            && state.LockedUntil > DateTimeOffset.UtcNow)
        {
            return null;
        }

        var configuredEmail = configuration["DevelopmentViewer:Email"];
        var configuredPassword = configuration["DevelopmentViewer:Password"];
        if (string.IsNullOrWhiteSpace(configuredEmail)
            || string.IsNullOrWhiteSpace(configuredPassword))
        {
            return null;
        }

        if (string.Equals(request.Email, configuredEmail, StringComparison.OrdinalIgnoreCase)
            && request.Password == configuredPassword)
        {
            failures.TryRemove(request.Email, out _);
            return new AuthenticatedUser(
                configuredEmail,
                configuration["DevelopmentViewer:Organization"] ?? "A",
                configuration["DevelopmentViewer:Region"] ?? "1",
                AuthorizationPolicies.ViewerRole);
        }

        failures.AddOrUpdate(request.Email, _ => (1, DateTimeOffset.MinValue), (_, current) =>
        {
            var attempts = current.Attempts + 1;
            return (attempts, attempts >= 5
                ? DateTimeOffset.UtcNow.AddMinutes(15)
                : DateTimeOffset.MinValue);
        });
        return null;
    }
}
