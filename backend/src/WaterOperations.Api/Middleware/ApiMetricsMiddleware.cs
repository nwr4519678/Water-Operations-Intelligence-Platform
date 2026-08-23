using System.Diagnostics;
using WaterOperations.Api.Observability;

namespace WaterOperations.Api.Middleware;

public sealed class ApiMetricsMiddleware(RequestDelegate next, ApiMetrics metrics)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            metrics.Record(context.Response.StatusCode, stopwatch.ElapsedMilliseconds);
        }
    }
}
