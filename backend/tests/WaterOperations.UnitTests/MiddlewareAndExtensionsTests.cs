using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using WaterOperations.Api.Extensions;
using WaterOperations.Api.Middleware;
using WaterOperations.Application.Common.Results;

namespace WaterOperations.UnitTests;

public sealed class MiddlewareAndExtensionsTests
{
    [Fact]
    public void ActionResultExtensions_ToActionResult_NotFound_ReturnsNotFoundObject()
    {
        var scopeResult = ScopeResult.NotFound<string>();
        var controller = new DummyController();

        var actionResult = scopeResult.ToActionResult(controller);

        Assert.IsType<NotFoundResult>(actionResult);
    }

    [Fact]
    public void ActionResultExtensions_ToActionResult_Forbidden_ReturnsForbidResult()
    {
        var scopeResult = ScopeResult.Forbidden<string>();
        var controller = new DummyController();

        var actionResult = scopeResult.ToActionResult(controller);

        Assert.IsType<ForbidResult>(actionResult);
    }

    [Fact]
    public void ActionResultExtensions_ToActionResult_Authorized_ReturnsOkObjectResult()
    {
        var scopeResult = ScopeResult.Authorized("data");
        var controller = new DummyController();

        var actionResult = scopeResult.ToActionResult(controller);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        Assert.Equal("data", okResult.Value);
    }

    [Fact]
    public async Task TraceIdMiddleware_CapsLongTraceIdHeader()
    {
        var middleware = new TraceIdMiddleware(innerContext => Task.CompletedTask);
        var httpContext = new DefaultHttpContext();
        var excessivelyLongTraceId = new string('a', 300);
        httpContext.Request.Headers["X-Trace-Id"] = excessivelyLongTraceId;

        await middleware.InvokeAsync(httpContext);

        Assert.NotEqual(excessivelyLongTraceId, httpContext.TraceIdentifier);
    }

    [Fact]
    public async Task TraceIdMiddleware_SanitizesUnsafeCharacters()
    {
        var middleware = new TraceIdMiddleware(innerContext => Task.CompletedTask);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Trace-Id"] = "<script>alert(1)</script>";

        await middleware.InvokeAsync(httpContext);

        Assert.NotEqual("<script>alert(1)</script>", httpContext.TraceIdentifier);
    }

    private sealed class DummyController : ControllerBase { }
}
