using Scalar.AspNetCore;
using WaterOperations.Application;
using WaterOperations.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Water Operations API"));
app.MapControllers();
app.Run();

public partial class Program { }
