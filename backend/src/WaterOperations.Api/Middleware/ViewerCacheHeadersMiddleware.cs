using System.Security.Cryptography;
using System.Text;

namespace WaterOperations.Api.Middleware;

public sealed class ViewerCacheHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var isViewerRead = context.Request.Method == HttpMethods.Get
            && context.Request.Path.StartsWithSegments("/api/v1/viewer");
        if (isViewerRead)
        {
            context.Response.OnStarting(() =>
            {
                if (context.Response.StatusCode is >= 200 and < 300)
                {
                    var organization = context.User.FindFirst("organization")?.Value ?? "anonymous";
                    var user = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
                    var cacheKey = $"v1|{organization}|{user}|{context.Request.Path}{context.Request.QueryString}";
                    var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(cacheKey)))[..32];
                    context.Response.Headers.ETag = $"\"{etag}\"";
                    context.Response.Headers.CacheControl = "private, max-age=5, must-revalidate";
                    context.Response.Headers["X-Data-As-Of"] = DateTimeOffset.UtcNow.ToString("O");
                    context.Response.Headers["X-Data-Stale"] = "false";
                }

                return Task.CompletedTask;
            });
        }

        await next(context);
    }
}
