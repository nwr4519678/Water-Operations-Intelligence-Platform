using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Application.Features.Ingestion.Interfaces;
using WaterOperations.Application.Features.Mfa.Interfaces;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Application.Features.Pipeline.Interfaces;
using WaterOperations.Application.Features.Retention.Interfaces;
using WaterOperations.Application.Features.Stations.Interfaces;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.Ingestion;
using WaterOperations.Infrastructure.Caching;
using WaterOperations.Infrastructure.Authentication;
using WaterOperations.Infrastructure.Configuration;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Mfa;
using WaterOperations.Infrastructure.Operations;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Persistence.Repositories;
using WaterOperations.Infrastructure.Pipeline;
using WaterOperations.Infrastructure.Retention;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Infrastructure.Stations;
using WaterOperations.Infrastructure.Storage;
using WaterOperations.Infrastructure.Telemetry;
using WaterOperations.Infrastructure.Time;
using WaterOperations.Infrastructure.Viewer;
using WaterOperations.Infrastructure.ProductCapabilities.AI;
using WaterOperations.Infrastructure.ProductCapabilities.Reports;
using WaterOperations.Infrastructure.ProductCapabilities.Notifications;
using WaterOperations.Infrastructure.ProductCapabilities.Audit;
using WaterOperations.Infrastructure.ProductCapabilities.Collaboration;
using WaterOperations.Infrastructure.ProductCapabilities.Administration;
using WaterOperations.Infrastructure.ProductCapabilities.Search;
using WaterOperations.Application.Features.AI.Contracts;
using WaterOperations.Application.Features.Reports.Contracts;
using WaterOperations.Application.Features.Notifications.Contracts;
using WaterOperations.Application.Features.Audit.Contracts;
using WaterOperations.Application.Features.Collaboration.Contracts;
using WaterOperations.Application.Features.Administration.Contracts;
using WaterOperations.Application.Features.Search.Contracts;
using WaterOperations.Application.Features.ProductCapabilities.AI;
using WaterOperations.Application.Features.ProductCapabilities.Reports;

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Default must be configured before starting the API.");

        if (string.IsNullOrWhiteSpace(connectionString)
            && configuration["Testing"] == "true")
        {
            connectionString = "Host=localhost;Database=water_operations_tests;Username=test;Password=test";
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Default must be configured through environment variables or user secrets.");
        }

        services
            .AddPersistence(configuration, connectionString)
            .AddInfrastructureOptions(configuration)
            .AddInfrastructureServices(configuration)
            .AddFeatureServices()
            .AddCaching()
            .AddBackgroundProcessing(configuration, connectionString);

        return services;
    }

    private static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        if (configuration["Testing"] == "true")
        {
            services.AddDbContext<WaterOperationsDbContext>(
                options => options.UseInMemoryDatabase("water-operations-tests"));
        }
        else
        {
            services.AddDbContext<WaterOperationsDbContext>(
                options => options.UseNpgsql(connectionString));
        }

        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IRepositoryContext, EfRepositoryContext>();
        services.AddScoped<IUnitOfWork>(
            serviceProvider => serviceProvider.GetRequiredService<WaterOperationsDbContext>());
        return services;
    }

    private static IServiceCollection AddInfrastructureOptions(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<InfrastructureOptions>(
            configuration.GetSection(InfrastructureOptions.SectionName));
        services.Configure<JwtAuthenticationOptions>(
            configuration.GetSection(JwtAuthenticationOptions.SectionName));
        services.Configure<AiModelClientOptions>(
            configuration.GetSection(AiModelClientOptions.SectionName));
        return services;
    }

    private static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddScoped<ICorrelationContext, HttpCorrelationContext>();
        services.AddScoped<IReportJobScheduler, NoOpReportJobScheduler>();
        if (configuration["Testing"] == "true")
        {
            services.AddSingleton<WaterOperations.Infrastructure.Telemetry.TelemetryStore>();
        }
        return services;
    }

    private static IServiceCollection AddFeatureServices(
        this IServiceCollection services)
    {
        services.AddScoped<IViewerQueryRepository, EfViewerQueryRepository>();
        services.AddSingleton<IUserCredentialRepository>(
            provider => provider.GetRequiredService<ViewerUserStore>());
        services.AddSingleton<IRefreshSessionRepository>(
            provider => provider.GetRequiredService<SessionStore>());
        services.AddSingleton<IAccessTokenIssuer>(
            provider => provider.GetRequiredService<AuthTokenService>());
        services.AddScoped<IStationQueryRepository, EfStationQueryRepository>();
        services.AddScoped<IOperationsQueryRepository, EfOperationsQueryRepository>();
        services.AddScoped<ITelemetryQueryRepository, EfTelemetryQueryRepository>();
        services.AddSingleton<ITelemetryFixtureReader, TelemetryFixtureReader>();
        services.AddScoped<IIngestionRepository, EfIngestionRepository>();
        services.AddScoped<ICsvBatchParser, CsvBatchParser>();
        services.AddScoped<IPipelineRepository, EfPipelineRepository>();
        services.AddScoped<IRetentionRepository, EfRetentionRepository>();
        services.AddScoped<IMfaRepository, EfMfaRepository>();
        services.AddScoped<IAiModelRepository, EfAiModelRepository>();
        services.AddScoped<IReportRepository, EfReportRepository>();
        services.AddScoped<INotificationRepository, EfNotificationRepository>();
        services.AddScoped<IAuditRepository, EfAuditRepository>();
        services.AddScoped<ICollaborationRepository, EfCollaborationRepository>();
        services.AddScoped<IAdministrationRepository, EfAdministrationRepository>();
        services.AddScoped<ISearchRepository, EfSearchRepository>();
        services.AddHttpClient<IAiModelClient, HttpAiModelClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiModelClientOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(options.TimeoutSeconds, 1, 120));
            if (!string.IsNullOrWhiteSpace(options.ApiKey))
            {
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", options.ApiKey);
            }
        });
        return services;
    }

    private static IServiceCollection AddCaching(
        this IServiceCollection services)
    {
        services.AddDistributedMemoryCache();
        services.AddHybridCache();
        services.AddSingleton<ICacheService, HybridCacheService>();
        services.AddSingleton<OutboxPayloadSerializer>();
        return services;
    }

    private static IServiceCollection AddBackgroundProcessing(
        this IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        services.AddScoped<OutboxPublisherJob>();
        if (configuration["Testing"] == "true")
        {
            return services;
        }

        var redisConnection = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Redis must be configured before starting the API.");
        services.AddSingleton<IConnectionMultiplexer>(
            _ => ConnectionMultiplexer.Connect(redisConnection));
        services.AddStackExchangeRedisCache(
            options => options.Configuration = redisConnection);
        services.AddHangfire(config => config
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(options => options
                .UseNpgsqlConnection(connectionString)));
        services.AddHangfireServer();
        services.AddScoped<IReportJobScheduler, HangfireReportJobScheduler>();
        return services;
    }
}
