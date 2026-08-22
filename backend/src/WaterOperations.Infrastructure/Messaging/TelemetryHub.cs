using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Stations.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Infrastructure.Messaging;

[Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
public sealed class TelemetryHub(
    IStationQueryRepository stations,
    ICurrentUser currentUser) : Hub<ITelemetryClient>
{
    public Task Subscribe()
    {
        var organization = Context.User?.FindFirst("organization")?.Value;
        var region = Context.User?.FindFirst("region")?.Value;
        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(region))
        {
            throw new HubException("scope_forbidden");
        }

        return Task.WhenAll(
            Groups.AddToGroupAsync(Context.ConnectionId, $"{organization}:{region}"),
            Groups.AddToGroupAsync(Context.ConnectionId, $"org:{organization}"));
    }

    public async Task SubscribeToStation(Guid stationId)
    {
        if (!currentUser.OrganizationId.HasValue)
        {
            throw new HubException("scope_forbidden");
        }

        var station = await stations.GetAsync(
            currentUser.OrganizationId.Value,
            stationId,
            Context.ConnectionAborted);
        if (station is null
            || (currentUser.RegionId.HasValue && station.RegionId != currentUser.RegionId))
        {
            throw new HubException("scope_forbidden");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"station:{stationId}");
    }
}
