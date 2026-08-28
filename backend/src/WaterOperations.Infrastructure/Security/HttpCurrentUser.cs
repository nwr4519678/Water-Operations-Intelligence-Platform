using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Infrastructure.Security;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId => Parse(ClaimTypes.NameIdentifier);

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    public Guid? OrganizationId => Parse("organization");

    public string? Organization => Principal?.FindFirstValue("organization");

    public Guid? RegionId => Parse("region");

    public string? Region => Principal?.FindFirstValue("region");

    public IReadOnlyCollection<string> Roles =>
        Principal?.FindAll("role").Select(x => x.Value).ToArray() ?? [];

    private Guid? Parse(string claim) =>
        Guid.TryParse(Principal?.FindFirstValue(claim), out var value) ? value : null;
}
