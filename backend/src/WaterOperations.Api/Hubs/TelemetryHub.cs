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
        var (organization, region) = ReadScope();
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(organization, region));
        await Clients.Caller.Protocol("telemetry.v1");
    }

    public async Task RefreshScope()
    {
        var (organization, region) = ReadScope();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(organization, region));
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(organization, region));
        await Clients.Caller.Protocol("telemetry.v1");
    }

    public Task Unsubscribe()
    {
        var scope = ReadOptionalScope();
        return scope is null ? Task.CompletedTask : Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(scope.Value.Organization, scope.Value.Region));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    private static string GroupName(string organization, string region) => $"telemetry:{organization}:{region}";

    private (string Organization, string Region) ReadScope() =>
        ReadOptionalScope() ?? throw new HubException("scope_forbidden");

    private (string Organization, string Region)? ReadOptionalScope()
    {
        var organization = Context.User?.FindFirst("organization")?.Value;
        var region = Context.User?.FindFirst("region")?.Value;
        return string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(region)
            ? null
            : (organization, region);
    }
}
