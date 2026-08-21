using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Hubs;

[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryHub : Hub
{
    public Task Subscribe(string organization, string region)
    {
        if (organization != Context.User?.FindFirst("organization")?.Value || region != Context.User?.FindFirst("region")?.Value)
            throw new HubException("scope_forbidden");
        return Groups.AddToGroupAsync(Context.ConnectionId, $"{organization}:{region}");
    }
}
