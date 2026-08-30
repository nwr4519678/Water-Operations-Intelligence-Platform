namespace WaterOperations.Api.Middleware;

public sealed class TraceIdMiddleware(RequestDelegate next)
{
    private const int MaxTraceIdLength = 128;

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = context.TraceIdentifier;
        if (context.Request.Headers.TryGetValue("X-Trace-Id", out var supplied)
            && !string.IsNullOrWhiteSpace(supplied))
        {
            // SEC-3: Cap length and allow only safe characters to prevent log injection.
            var candidate = supplied.ToString();
            if (candidate.Length <= MaxTraceIdLength
                && candidate.All(c => char.IsLetterOrDigit(c) || c is '-' or '_' or '.'))
            {
                traceId = candidate;
            }
        }

        context.TraceIdentifier = traceId;
        context.Response.Headers["X-Trace-Id"] = traceId;
        await next(context);
    }
}
