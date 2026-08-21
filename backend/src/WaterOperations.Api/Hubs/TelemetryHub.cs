using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Application.Common.Contracts;

namespace WaterOperations.Api.Hubs;

[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryHub : Hub<ITelemetryClient>
{
    public async Task Subscribe()
    {
        var organization = Context.User?.FindFirst("organization")?.Value;
        var region = Context.User?.FindFirst("region")?.Value;
        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(region))
            throw new HubException("scope_forbidden");
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(organization, region));
        await Clients.Caller.Protocol("telemetry.v1");
    }

    public Task Unsubscribe()
    {
        var organization = Context.User?.FindFirst("organization")?.Value;
        var region = Context.User?.FindFirst("region")?.Value;
        return string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(region)
            ? Task.CompletedTask
            : Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(organization, region));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    private static string GroupName(string organization, string region) => $"telemetry:{organization}:{region}";
}
