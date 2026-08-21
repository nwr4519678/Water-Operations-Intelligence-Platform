using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Security;

public sealed record ViewerUser(string Email, string Password, string Organization, string Region, string Role, Guid? UserId = null);

public sealed class ViewerUserStore(WaterOperationsDbContext db, IConfiguration configuration)
{
    public async Task<ViewerUser?> FindAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        // The configured viewer exists only for automated tests and local development.
        if (configuration["Testing"] == "true" || string.Equals(configuration["ASPNETCORE_ENVIRONMENT"], "Development", StringComparison.OrdinalIgnoreCase))
        {
            var configuredEmail = configuration["DevelopmentViewer:Email"];
            var configuredPassword = configuration["DevelopmentViewer:Password"];
            if (!string.IsNullOrWhiteSpace(configuredEmail) && string.Equals(email, configuredEmail, StringComparison.OrdinalIgnoreCase) && password == configuredPassword)
            {
                return new ViewerUser(configuredEmail, string.Empty, configuration["DevelopmentViewer:Organization"] ?? "A", configuration["DevelopmentViewer:Region"] ?? "1", AuthorizationPolicies.ViewerRole);
            }
        }

        var user = await db.Users
            .AsNoTracking()
            .Include(candidate => candidate.Organization)
            .Include(candidate => candidate.UserRoleUsers)
                .ThenInclude(userRole => userRole.Role)
            .SingleOrDefaultAsync(candidate => candidate.IsActive && candidate.Email == email, cancellationToken);
        if (user is null || !VerifyPassword(password, user.PasswordHash)) return null;

        var role = user.UserRoleUsers.Select(userRole => userRole.Role.Code).FirstOrDefault() ?? AuthorizationPolicies.ViewerRole;
        return new ViewerUser(user.Email, string.Empty, user.OrganizationId.ToString(), string.Empty, role, user.UserId);
    }

    private static bool VerifyPassword(string password, string encodedHash)
    {
        var parts = encodedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 4 || !string.Equals(parts[0], "pbkdf2", StringComparison.Ordinal)) return false;
        if (!int.TryParse(parts[1], out var iterations)) return false;
        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException) { return false; }
    }
}
