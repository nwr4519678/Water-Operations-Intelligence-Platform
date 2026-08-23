using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Distributed;

namespace WaterOperations.Api.Middleware;

public sealed class IdempotencyMiddleware(RequestDelegate next, IDistributedCache cache)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);

    public async Task InvokeAsync(HttpContext context)
    {
        if (!IsMutation(context.Request.Method)
            || !context.Request.Headers.TryGetValue("Idempotency-Key", out var suppliedKey)
            || string.IsNullOrWhiteSpace(suppliedKey))
        {
            await next(context);
            return;
        }

        var key = BuildCacheKey(context, suppliedKey.ToString());
        var cached = await cache.GetStringAsync(key, context.RequestAborted);
        if (cached is not null)
        {
            await WriteCachedResponseAsync(context, cached);
            return;
        }

        await using var responseBody = new MemoryStream();
        var originalBody = context.Response.Body;
        context.Response.Body = responseBody;
        try
        {
            await next(context);
            if (context.Response.StatusCode is >= 200 and < 300)
            {
                responseBody.Position = 0;
                var payload = await new StreamReader(responseBody).ReadToEndAsync(context.RequestAborted);
                await cache.SetStringAsync(
                    key,
                    string.Join('\n', context.Response.StatusCode, context.Response.ContentType, payload),
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = Lifetime },
                    context.RequestAborted);
            }

            responseBody.Position = 0;
            await responseBody.CopyToAsync(originalBody, context.RequestAborted);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static async Task WriteCachedResponseAsync(HttpContext context, string cached)
    {
        var parts = cached.Split('\n', 3);
        if (parts.Length != 3 || !int.TryParse(parts[0], out var statusCode))
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsync("Invalid idempotency cache entry.", context.RequestAborted);
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = parts[1];
        context.Response.Headers["Idempotency-Replayed"] = "true";
        await context.Response.WriteAsync(parts[2], context.RequestAborted);
    }

    private static bool IsMutation(string method) =>
        HttpMethods.IsPost(method) || HttpMethods.IsPut(method)
        || HttpMethods.IsPatch(method) || HttpMethods.IsDelete(method);

    private static string BuildCacheKey(HttpContext context, string idempotencyKey)
    {
        var scope = context.User.FindFirst("organization")?.Value ?? "anonymous";
        var identity = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var raw = string.Join('|', scope, identity, context.Request.Method, context.Request.Path, idempotencyKey);
        return "water-operations:idempotency:" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }
}
