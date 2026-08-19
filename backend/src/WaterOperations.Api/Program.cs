using Scalar.AspNetCore;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Serilog;
using WaterOperations.Application;
using WaterOperations.Infrastructure;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Seeding;
using WaterOperations.Api.Middleware;

Log.Logger = new LoggerConfiguration().WriteTo.Console(formatProvider: CultureInfo.InvariantCulture).CreateBootstrapLogger();
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, logger) => logger.ReadFrom.Configuration(context.Configuration).Enrich.FromLogContext());
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddPolicy("Web", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<WaterOperationsDbContext>(tags: ["ready"]);

var app = builder.Build();
app.UseCors("Web");
app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.MapHealthChecks("/health");
app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
app.MapControllers();
if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Seed:Enabled"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
    await db.Database.MigrateAsync();
    await ViewerSeed.SeedAsync(db);
}
app.Run();

public partial class Program { }
