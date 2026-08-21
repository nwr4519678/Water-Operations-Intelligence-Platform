using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Infrastructure.Security;

public sealed class HttpTenantContext(IHttpContextAccessor accessor) : ITenantContext
{
    public Guid? OrganizationId => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue("organization"), out var value) ? value : null;
    public string? Region => accessor.HttpContext?.User.FindFirstValue("region");
}
