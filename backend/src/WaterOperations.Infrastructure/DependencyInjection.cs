using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default") ?? "Host=localhost;Port=5432;Database=water_operations;Username=postgres;Password=postgres";
        if (configuration["Testing"] == "true") services.AddDbContext<WaterOperationsDbContext>(options => options.UseInMemoryDatabase("water-operations-tests"));
        else services.AddDbContext<WaterOperationsDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork>(serviceProvider => serviceProvider.GetRequiredService<WaterOperationsDbContext>());
        if (configuration["Testing"] != "true")
        {
            services.AddStackExchangeRedisCache(options => options.Configuration = configuration.GetConnectionString("Redis") ?? "localhost:6379");
            services.AddHybridCache();
            services.AddHangfire(config => config.UseSimpleAssemblyNameTypeSerializer().UseRecommendedSerializerSettings().UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));
            services.AddHangfireServer();
        }
        return services;
    }
}
