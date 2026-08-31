using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Caching;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Application.Features.Administration.Interfaces;
using WaterOperations.Application.Features.Alarms.Interfaces;
using WaterOperations.Application.Features.Audit.Interfaces;
using WaterOperations.Application.Features.Auth.Interfaces;
using WaterOperations.Application.Features.Charts.Interfaces;
using WaterOperations.Application.Features.Collaboration.Interfaces;
using WaterOperations.Application.Features.Ingestion.Interfaces;
using WaterOperations.Application.Features.Mfa.Interfaces;
using WaterOperations.Application.Features.Notifications.Interfaces;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Application.Features.Pipeline.Interfaces;
using WaterOperations.Application.Features.Reports.Interfaces;
using WaterOperations.Application.Features.Retention.Interfaces;
using WaterOperations.Application.Features.Search.Interfaces;
using WaterOperations.Application.Features.Stations.Interfaces;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Application.Features.Thresholds.Interfaces;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Infrastructure.AI;
using WaterOperations.Infrastructure.AI.Repositories;
using WaterOperations.Infrastructure.Administration.Repositories;
using WaterOperations.Infrastructure.Audit.Repositories;
using WaterOperations.Infrastructure.Authentication;
using WaterOperations.Infrastructure.Operations.Repositories;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Infrastructure.Caching;
using WaterOperations.Infrastructure.Collaboration.Repositories;
using WaterOperations.Infrastructure.Configuration;
using WaterOperations.Infrastructure.Ingestion;
using WaterOperations.Infrastructure.Ingestion.Repositories;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Mfa.Repositories;
using WaterOperations.Infrastructure.Notifications.Repositories;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Persistence.Repositories;
using WaterOperations.Infrastructure.Pipeline.Repositories;
using WaterOperations.Infrastructure.Reports;
using WaterOperations.Infrastructure.Reports.Repositories;
using WaterOperations.Infrastructure.Retention.Repositories;
using WaterOperations.Infrastructure.Search.Repositories;
using WaterOperations.Infrastructure.Stations.Repositories;
using WaterOperations.Infrastructure.Storage;
using WaterOperations.Infrastructure.Telemetry.Repositories;
using WaterOperations.Infrastructure.Time;
using WaterOperations.Infrastructure.Viewer.Repositories;

namespace WaterOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var isTesting = configuration["Testing"] == "true" || configuration.GetValue<bool>("Testing");
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            if (isTesting)
            {
                connectionString = "Host=localhost;Database=TestDatabase;Username=postgres;Password=postgres";
            }
            else
            {
                throw new InvalidOperationException(
                    "ConnectionStrings:Default is not configured. " +
                    "Set it via 'ConnectionStrings__Default' or .NET user secrets. " +
                    "Development does not use an embedded database password.");
            }
        }

        services
            .AddPersistence(configuration, connectionString)
            .AddInfrastructureOptions(configuration)
            .AddInfrastructureServices(configuration)
            .AddFeatureServices(configuration)
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
                options => options.UseNpgsql(connectionString)
                    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
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
        return services;
    }

    private static IServiceCollection AddFeatureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IViewerQueryRepository, ViewerQueryRepository>();
        if (configuration.GetValue<bool>("Testing"))
        {
            services.AddSingleton<IUserCredentialRepository, ViewerUserStore>();
        }
        else
        {
            services.AddSingleton<DatabaseUserStore>();
            services.AddSingleton<IUserCredentialRepository>(
                provider => provider.GetRequiredService<DatabaseUserStore>());
        }
        services.AddSingleton<IRefreshSessionRepository>(
            provider => provider.GetRequiredService<SessionStore>());
        services.AddSingleton<IAccessTokenIssuer>(
            provider => provider.GetRequiredService<AuthTokenService>());
        services.AddScoped<IStationQueryRepository, StationQueryRepository>();
        services.AddScoped<IOperationsQueryRepository, OperationsQueryRepository>();
        services.AddScoped<ITelemetryQueryRepository, TelemetryQueryRepository>();
        services.AddScoped<IIngestionRepository, IngestionRepository>();
        services.AddScoped<ICsvBatchParser, CsvBatchParser>();
        services.AddScoped<IPipelineRepository, PipelineRepository>();
        services.AddScoped<IRetentionRepository, RetentionRepository>();
        services.AddScoped<IMfaRepository, MfaRepository>();
        services.AddScoped<IAiModelRepository, AiModelRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<ICollaborationRepository, CollaborationRepository>();
        services.AddScoped<IAdministrationRepository, AdministrationRepository>();
        services.AddScoped<ISearchRepository, SearchRepository>();
        services.AddScoped<IAlarmRepository, AlarmRepository>();
        services.AddScoped<IThresholdRepository, ThresholdRepository>();
        services.AddScoped<IChartAnnotationRepository, ChartAnnotationRepository>();
        services.AddScoped<IStationAuthorizationService, StationAuthorizationService>();
        services.AddSingleton<AiModelCircuitBreaker>();
        services.AddHttpClient<IAiModelClient, HttpAiModelClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiModelClientOptions>>().Value;
            var baseUrl = string.IsNullOrWhiteSpace(options.BaseUrl) ? "http://localhost:8000" : options.BaseUrl;
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
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
        if (configuration["Testing"] == "true" || configuration.GetValue<bool>("Testing"))
        {
            services.AddScoped<IReportJobScheduler, NoOpReportJobScheduler>();
            return services;
        }

        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            try
            {
                services.AddSingleton<IConnectionMultiplexer>(
                    _ => ConnectionMultiplexer.Connect(redisConnection));
                services.AddStackExchangeRedisCache(
                    options => options.Configuration = redisConnection);
            }
            catch
            {
                // Soft fallback if Redis server is unreachable locally
            }
        }

        services.AddHangfire(config => config
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(options => options
                .UseNpgsqlConnection(connectionString),
                new Hangfire.PostgreSql.PostgreSqlStorageOptions
                {
                    SchemaName = "hangfire",
                    PrepareSchemaIfNecessary = true,
                }));
        services.AddHangfireServer(options => { options.WorkerCount = 4; });
        services.AddScoped<IReportJobScheduler, HangfireReportJobScheduler>();

        return services;
    }
}
