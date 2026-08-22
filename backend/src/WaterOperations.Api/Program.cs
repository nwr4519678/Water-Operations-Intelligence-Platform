using Scalar.AspNetCore;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Serilog;
using WaterOperations.Application;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Seeding;
using WaterOperations.Infrastructure.Viewer;
using WaterOperations.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Api.Common;
using WaterOperations.Api.Hubs;
using StackExchange.Redis;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

Log.Logger = new LoggerConfiguration().WriteTo.Console(formatProvider: CultureInfo.InvariantCulture).CreateBootstrapLogger();
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, logger) => logger.ReadFrom.Configuration(context.Configuration).Enrich.FromLogContext(), preserveStaticLogger: true);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<SessionStore>();
builder.Services.AddScoped<ViewerUserStore>();
builder.Services.AddSingleton<IAuthorizationHandler, OrganizationScopeHandler>();
if (builder.Configuration["Testing"] == "true") builder.Services.AddSingleton<TelemetryStore>();
builder.Services.AddScoped<ITelemetryReadService, EfTelemetryReadService>();
builder.Services.AddSingleton<AuthTokenService>();
builder.Services.AddSingleton<MfaChallengeTokenService>();
var signingKey = builder.Configuration["Authentication:SigningKey"];
if (builder.Configuration["Testing"] != "true" && !builder.Environment.IsDevelopment() &&
    (string.IsNullOrWhiteSpace(signingKey) || signingKey.StartsWith("development-only-", StringComparison.Ordinal)))
{
    throw new InvalidOperationException("Authentication:SigningKey must be supplied from production secret storage.");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    var key = signingKey ?? "development-only-signing-key-change-me-please";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = builder.Configuration["Authentication:Issuer"] ?? "water-operations",
        ValidateAudience = true, ValidAudience = builder.Configuration["Authentication:Audience"] ?? "water-operations-web",
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(30), RoleClaimType = "role"
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrWhiteSpace(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.ViewerOnly, policy => policy
        .RequireAuthenticatedUser().RequireRole(AuthorizationPolicies.ViewerRole)
        .AddRequirements(new OrganizationScopeRequirement()));
    options.AddPolicy(AuthorizationPolicies.OperatorOnly, policy => policy
        .RequireAuthenticatedUser().RequireRole(AuthorizationPolicies.OperatorRole, AuthorizationPolicies.AdminRole)
        .AddRequirements(new OrganizationScopeRequirement()));
    options.AddPolicy(AuthorizationPolicies.AdminOnly, policy => policy
        .RequireAuthenticatedUser().RequireRole(AuthorizationPolicies.AdminRole)
        .AddRequirements(new OrganizationScopeRequirement()));
});
builder.Services.AddCors(options => options.AddPolicy("Web", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddControllers();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth-login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddSignalR();
if (builder.Configuration["Testing"] != "true")
{
    var redisConnection = builder.Configuration.GetConnectionString("Redis")
        ?? throw new InvalidOperationException("ConnectionStrings:Redis must be configured for SignalR scale-out.");
    builder.Services.AddSignalR().AddStackExchangeRedis(redisConnection, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("water-operations:signalr");
    });
    builder.Services.AddHostedService<IntegrationEventSubscriber>();
    builder.Services.AddHostedService<WaterOperations.Infrastructure.Jobs.ImportJobWorker>();
}
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
var healthChecks = builder.Services.AddHealthChecks().AddDbContextCheck<WaterOperationsDbContext>(tags: ["ready"]);
if (builder.Configuration["Testing"] != "true")
{
    healthChecks
        .AddCheck<WaterOperations.Infrastructure.HealthChecks.DatabaseReadinessCheck>("database")
        .AddCheck<WaterOperations.Infrastructure.HealthChecks.RedisReadinessCheck>("redis")
        .AddCheck<WaterOperations.Infrastructure.HealthChecks.JobExecutionHealthCheck>("jobs");
}

var app = builder.Build();
app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseCors("Web");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
app.MapGet("/health/live", () => Results.Ok(new { status = "healthy", service = "api" }));
app.MapHealthChecks("/health/ready");
app.MapControllers();
if (app.Configuration["Testing"] == "true" || (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Seed:Enabled")))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
    if (app.Configuration["Testing"] == "true")
    {
        await db.Database.EnsureCreatedAsync();
    }
    else
    {
        var migrationRunner = scope.ServiceProvider.GetRequiredService<IPostgreSqlMigrationRunner>();
        await migrationRunner.ApplyAsync();
    }

    if (app.Configuration.GetValue<bool>("Seed:Enabled"))
    {
        await ViewerSeed.SeedAsync(db);
    }
}
app.MapHub<TelemetryHub>("/hubs/telemetry");
app.Run();

public partial class Program { }
