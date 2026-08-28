using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using WaterOperations.Api.Observability;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Authentication;
using WaterOperations.Infrastructure.HealthChecks;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api;

/// <summary>
/// Dependency injection registrations for the API presentation layer.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApiHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var healthChecks = services
            .AddHealthChecks()
            .AddDbContextCheck<WaterOperationsDbContext>(tags: ["ready"]);

        if (configuration["Testing"] != "true")
        {
            healthChecks
                .AddCheck<DatabaseReadinessCheck>("database")
                .AddCheck<RedisReadinessCheck>("redis");
        }

        return services;
    }

    public static IServiceCollection AddApi(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddApiCoreServices(configuration)
            .AddAuthenticationServices(configuration)
            .AddAuthorizationServices()
            .AddCorsServices(configuration)
            .AddRateLimiting()
            .AddRealtime(configuration)
            .AddApiInfrastructure();

        return services;
    }

    private static IServiceCollection AddApiCoreServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<ApiMetrics>();
        services.AddScoped<ICurrentUser, HttpCurrentUser>();
        services.AddSingleton<SessionStore>();
        services.AddSingleton<ViewerUserStore>();

        return services;
    }

    private static IServiceCollection AddAuthenticationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<AuthTokenService>();
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options => ConfigureJwt(options, configuration));

        return services;
    }

    private static void ConfigureJwt(
        JwtBearerOptions options,
        IConfiguration configuration)
    {
        options.MapInboundClaims = false;
        var signingKey = configuration["Authentication:SigningKey"];
        if (string.IsNullOrWhiteSpace(signingKey))
        {
            signingKey = JwtAuthenticationOptions.DevSigningKey;
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = configuration["Authentication:Issuer"] ?? "water-operations",
            ValidateAudience = true,
            ValidAudience = configuration["Authentication:Audience"] ?? "water-operations-web",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = "role"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context => SetSignalRAccessToken(context)
        };
    }

    private static Task SetSignalRAccessToken(MessageReceivedContext context)
    {
        var accessToken = context.Request.Query["access_token"];
        if (!string.IsNullOrWhiteSpace(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
        {
            context.Token = accessToken;
        }

        return Task.CompletedTask;
    }

    private static IServiceCollection AddAuthorizationServices(
        this IServiceCollection services)
    {
        services.AddAuthorization(options =>
            options.AddPolicy(
                AuthorizationPolicies.ViewerOnly,
                policy => policy
                    .RequireAuthenticatedUser()
                    .RequireRole("VIEWER", "OPERATOR", "ADMIN")));

        return services;
    }

    private static IServiceCollection AddCorsServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddCors(options => options.AddPolicy("Web", policy => policy
            .WithOrigins(
                configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

        return services;
    }

    private static IServiceCollection AddRateLimiting(
        this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.Headers.RetryAfter = "60";
                await Results.Problem(
                    statusCode: StatusCodes.Status429TooManyRequests,
                    title: "Too many requests",
                    detail: "Please retry after the rate limit window resets.")
                    .ExecuteAsync(context.HttpContext);
            };

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 300,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));

            options.AddPolicy("search", context => RateLimitPartition.GetFixedWindowLimiter(
                context.User.FindFirst("organization")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
        });

        return services;
    }

    private static IServiceCollection AddRealtime(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var signalR = services.AddSignalR();
        var redisConnection = configuration.GetConnectionString("Redis");

        if (configuration["Testing"] != "true" && !string.IsNullOrWhiteSpace(redisConnection))
        {
            signalR.AddStackExchangeRedis(redisConnection);
        }

        return services;
    }

    private static IServiceCollection AddApiInfrastructure(
        this IServiceCollection services)
    {
        services.AddControllers();
        services.AddOpenApi();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
            {
                Title = "Water Operations API",
                Version = "v1",
                Description = "Versioned API contract for the Water Operations platform."
            });
        });
        services.AddProblemDetails();
        return services;
    }
}
