using Scalar.AspNetCore;
using WaterOperations.Application;
using WaterOperations.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddPolicy("Viewer", policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").GetChildren()
            .Select(section => section.Value)
            .OfType<string>()
            .DefaultIfEmpty("http://localhost:5173")
            .ToArray())
        .AllowAnyHeader()
        .AllowAnyMethod()));
builder.Services.AddHealthChecks()
    .AddCheck<WaterOperations.Infrastructure.HealthChecks.DatabaseReadinessCheck>("database")
    .AddCheck<WaterOperations.Infrastructure.HealthChecks.RedisReadinessCheck>("redis");

var app = builder.Build();
app.UseCors("Viewer");
app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
app.MapGet("/health/live", () => Results.Ok(new { status = "healthy", service = "api" }));
app.MapHealthChecks("/health/ready");
app.MapControllers();
app.Run();

public partial class Program { }
