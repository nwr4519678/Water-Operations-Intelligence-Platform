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

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default must be configured before starting the API.");
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
        services.AddScoped<IUnitOfWork>(serviceProvider => serviceProvider.GetRequiredService<WaterOperationsDbContext>());
        services.AddScoped<IViewerReadService, EfViewerReadService>();
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
