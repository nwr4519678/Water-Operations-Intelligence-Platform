using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace WaterOperations.Infrastructure.Security;

public sealed class OrganizationScopeRequirement : IAuthorizationRequirement;

public sealed class OrganizationScopeHandler(IConfiguration configuration) : AuthorizationHandler<OrganizationScopeRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, OrganizationScopeRequirement requirement)
    {
        var organization = context.User.FindFirst("organization")?.Value;
        var validProductionScope = !string.IsNullOrWhiteSpace(organization) && Guid.TryParse(organization, out _);
        var validTestScope = configuration["Testing"] == "true" && !string.IsNullOrWhiteSpace(organization);
        if (validProductionScope || validTestScope)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
