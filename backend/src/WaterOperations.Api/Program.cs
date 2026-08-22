using WaterOperations.Api;
using WaterOperations.Api.Hosting;
using WaterOperations.Application;
using WaterOperations.Infrastructure;
using WaterOperations.Infrastructure.Logging;
using WaterOperations.Infrastructure.Startup;

namespace WaterOperations.Api;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        LoggingConfiguration.Configure(builder.Host);
        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddApi(builder.Configuration);
        builder.Services.AddApiHealthChecks(builder.Configuration);

        var app = builder.Build();
        app.Configure();
        await app.InitializeAsync();
        app.ScheduleRecurringJobs();
        app.Run();
    }
}
