using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using StackExchange.Redis;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.Viewer;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Telemetry;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Infrastructure.Operations;

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default must be configured before starting the API.");
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, HttpTenantContext>();
        if (configuration["Testing"] == "true")
        {
            services.AddDbContext<WaterOperationsDbContext>(options => options.UseInMemoryDatabase("water-operations-tests"));
        }
        else
        {
            services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
            services.AddDbContext<WaterOperationsDbContext>((provider, options) =>
                options.UseNpgsql(provider.GetRequiredService<NpgsqlDataSource>()));
        }
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IPostgreSqlMigrationRunner, PostgreSqlMigrationRunner>();
        services.AddScoped<IUnitOfWork>(serviceProvider => serviceProvider.GetRequiredService<WaterOperationsDbContext>());
        services.AddScoped<IOutboxWriter, OutboxWriter>();
        services.AddScoped<IViewerReadService, EfViewerReadService>();
        services.AddScoped<IOverviewService, EfOverviewService>();
        services.AddScoped<IMeasurementIngestionService, EfMeasurementIngestionService>();
        services.AddScoped<IAlarmLifecycleService, EfAlarmLifecycleService>();
        if (configuration["Testing"] != "true")
        {
            var redisConnection = configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException("ConnectionStrings:Redis must be configured before starting the API.");
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));
            services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);
            services.AddHybridCache();
            services.AddHangfire(config => config.UseSimpleAssemblyNameTypeSerializer().UseRecommendedSerializerSettings().UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString!)));
            services.AddHangfireServer();
        }
        return services;
    }
}
