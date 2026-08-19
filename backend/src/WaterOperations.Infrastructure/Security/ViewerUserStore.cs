using Microsoft.Extensions.Configuration;

namespace WaterOperations.Infrastructure.Security;

public sealed record ViewerUser(string Email, string Password, string Organization, string Region, string Role);

public sealed class ViewerUserStore(IConfiguration configuration)
{
    public ViewerUser? Find(string email, string password)
    {
        var configuredEmail = configuration["DevelopmentViewer:Email"];
        var configuredPassword = configuration["DevelopmentViewer:Password"];
        if (string.IsNullOrWhiteSpace(configuredEmail) || string.IsNullOrWhiteSpace(configuredPassword)) return null;
        return string.Equals(email, configuredEmail, StringComparison.OrdinalIgnoreCase) && password == configuredPassword
            ? new ViewerUser(configuredEmail, configuredPassword, configuration["DevelopmentViewer:Organization"] ?? "A", configuration["DevelopmentViewer:Region"] ?? "1", AuthorizationPolicies.ViewerRole)
            : null;
    }
}
