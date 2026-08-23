using Scalar.AspNetCore;
using Serilog;
using WaterOperations.Api.Middleware;
using WaterOperations.Infrastructure.Messaging;

namespace WaterOperations.Api.Hosting;

public static class ApiPipeline
{
    public static void Configure(this WebApplication app)
    {
        app.UseMiddleware<TraceIdMiddleware>();
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<IdempotencyMiddleware>();
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }
        app.UseSerilogRequestLogging();
        app.UseCors("Web");
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseMiddleware<ViewerCacheHeadersMiddleware>();
        app.UseRateLimiter();
        app.UseSwagger();
        app.UseSwaggerUI(options =>
            options.SwaggerEndpoint(
                "/swagger/v1/swagger.json",
                "Water Operations API v1"));
        app.MapHealthChecks("/health");
        app.MapOpenApi();
        app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
        app.MapGet(
            "/health/live",
            () => Results.Ok(new { status = "healthy", service = "api" }));
        app.MapHealthChecks("/health/ready");
        app.MapControllers();
        app.MapHub<TelemetryHub>("/hubs/telemetry");
    }
}
