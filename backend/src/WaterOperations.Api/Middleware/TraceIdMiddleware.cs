namespace WaterOperations.Api.Middleware;

public sealed class TraceIdMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context)
    {
        var traceId = context.Request.Headers.TryGetValue("X-Trace-Id", out var supplied) && !string.IsNullOrWhiteSpace(supplied)
            ? supplied.ToString() : context.TraceIdentifier;
        context.TraceIdentifier = traceId;
        context.Response.Headers["X-Trace-Id"] = traceId;
        await next(context);
    }
}
