using System.Globalization;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace WaterOperations.Infrastructure.Logging;

public static class LoggingConfiguration
{
    public static void Configure(IHostBuilder hostBuilder)
    {
        Log.Logger = new LoggerConfiguration()
            .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
            .CreateBootstrapLogger();
        hostBuilder.UseSerilog(
            (context, logger) => logger
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext(),
            preserveStaticLogger: true);
    }
}
