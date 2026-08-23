using Microsoft.AspNetCore.Http;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Infrastructure.Security;

public sealed class HttpCorrelationContext(IHttpContextAccessor accessor) : ICorrelationContext
{
    public string CorrelationId =>
        accessor.HttpContext?.Request.Headers["X-Correlation-Id"].FirstOrDefault()
        ?? accessor.HttpContext?.TraceIdentifier
        ?? Guid.NewGuid().ToString("N");
}
