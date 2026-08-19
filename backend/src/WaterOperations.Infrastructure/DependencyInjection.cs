using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.Viewer;

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString) && configuration["Testing"] != "true")
            throw new InvalidOperationException("ConnectionStrings:Default must be configured through environment-specific configuration.");
        if (configuration["Testing"] == "true") services.AddDbContext<WaterOperationsDbContext>(options => options.UseInMemoryDatabase("water-operations-tests"));
        else services.AddDbContext<WaterOperationsDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork>(serviceProvider => serviceProvider.GetRequiredService<WaterOperationsDbContext>());
        services.AddScoped<IViewerReadService, EfViewerReadService>();
        if (configuration["Testing"] != "true")
        {
            var redis = configuration.GetConnectionString("Redis");
            if (!string.IsNullOrWhiteSpace(redis)) services.AddStackExchangeRedisCache(options => options.Configuration = redis);
            services.AddHybridCache();
            services.AddHangfire(config => config.UseSimpleAssemblyNameTypeSerializer().UseRecommendedSerializerSettings().UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString!)));
            services.AddHangfireServer();
        }
        return services;
    }
}
