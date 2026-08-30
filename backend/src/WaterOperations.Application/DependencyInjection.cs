using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using WaterOperations.Application.Common.Behaviors;

namespace WaterOperations.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(config =>
            config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddAutoMapper(cfg =>
            cfg.AddMaps(typeof(DependencyInjection).Assembly));

        // Pipeline behavior execution order:
        // 1. Authorization - Reject unauthorized requests immediately
        // 2. QueryCaching - Return cached query response if present before validation/handler
        // 3. Validation - Validate request parameters
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuthorizationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(QueryCachingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
