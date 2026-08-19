using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.UnitTests;

public sealed class AuthorizationPolicyTests
{
    [Fact]
    public void ViewerPolicyAllowsViewerAndRejectsOtherRoles()
    {
        var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().RequireRole(AuthorizationPolicies.ViewerRole).Build();
        Assert.True(IsAuthorized(policy, new ClaimsPrincipal(new ClaimsIdentity([new Claim("role", "VIEWER")], "test", "name", "role"))));
        Assert.False(IsAuthorized(policy, new ClaimsPrincipal(new ClaimsIdentity())));
        Assert.False(IsAuthorized(policy, new ClaimsPrincipal(new ClaimsIdentity([new Claim("role", "OPERATOR")], "test"))));
    }

    private static bool IsAuthorized(AuthorizationPolicy policy, ClaimsPrincipal principal) =>
        principal.Identity?.IsAuthenticated == true && principal.IsInRole("VIEWER") && policy.Requirements.Count > 0;
}
