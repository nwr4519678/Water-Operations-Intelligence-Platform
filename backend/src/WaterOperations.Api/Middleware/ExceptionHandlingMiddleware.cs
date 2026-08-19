using System.Text.Json;
using Serilog;
using WaterOperations.Api.Common;

namespace WaterOperations.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, IHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public async Task Invoke(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            Log.Error(exception, "Unhandled exception for trace {TraceId}", context.TraceIdentifier);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var message = environment.IsDevelopment() ? "An unexpected error occurred." : "An unexpected server error occurred.";
            await context.Response.WriteAsync(JsonSerializer.Serialize(ApiEnvelope<object>.Fail("INTERNAL_ERROR", message, context.TraceIdentifier), JsonOptions));
        }
    }
}
