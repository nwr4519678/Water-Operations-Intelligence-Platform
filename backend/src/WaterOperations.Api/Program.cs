using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WaterOperations.Application;
using WaterOperations.Infrastructure;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Api.Common;
using WaterOperations.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<SessionStore>();
builder.Services.AddSingleton<ViewerUserStore>();
builder.Services.AddSingleton<TelemetryStore>();
builder.Services.AddSingleton<AuthTokenService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    var key = builder.Configuration["Authentication:SigningKey"] ?? "development-only-signing-key-change-me-please";
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
builder.Services.AddAuthorization(options => options.AddPolicy(AuthorizationPolicies.ViewerOnly,
    policy => policy.RequireAuthenticatedUser().RequireRole(AuthorizationPolicies.ViewerRole)));
builder.Services.AddCors(options => options.AddPolicy("Web", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks()
    .AddCheck<WaterOperations.Infrastructure.HealthChecks.DatabaseReadinessCheck>("database")
    .AddCheck<WaterOperations.Infrastructure.HealthChecks.RedisReadinessCheck>("redis");

var app = builder.Build();
app.UseCors("Web");
app.UseAuthentication();
app.UseAuthorization();
app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
app.MapGet("/health/live", () => Results.Ok(new { status = "healthy", service = "api" }));
app.MapHealthChecks("/health/ready");
app.MapControllers();
app.MapHub<TelemetryHub>("/hubs/telemetry");
app.Run();

public partial class Program { }
