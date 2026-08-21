using Microsoft.AspNetCore.Authorization;

namespace WaterOperations.Infrastructure.Security;

public sealed class OrganizationScopeRequirement : IAuthorizationRequirement;

public sealed class OrganizationScopeHandler : AuthorizationHandler<OrganizationScopeRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, OrganizationScopeRequirement requirement)
    {
        var organization = context.User.FindFirst("organization")?.Value;
        if (!string.IsNullOrWhiteSpace(organization) && Guid.TryParse(organization, out _))
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
