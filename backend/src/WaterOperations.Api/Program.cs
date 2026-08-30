using WaterOperations.Api.Hosting;
using WaterOperations.Application;
using WaterOperations.Infrastructure;
using WaterOperations.Infrastructure.Logging;
using WaterOperations.Infrastructure.Startup;

namespace WaterOperations.Api;

/// <summary>
/// Web API application entry point.
/// </summary>
public partial class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        LoggingConfiguration.Configure(builder.Host);

        builder.Services
            .AddApplication()
            .AddInfrastructure(builder.Configuration)
            .AddApi(builder.Configuration)
            .AddApiHealthChecks(builder.Configuration);

        var app = builder.Build();

        app.Configure();
        await app.InitializeAsync();
        app.ScheduleRecurringJobs();

        app.Run();
    }
}
