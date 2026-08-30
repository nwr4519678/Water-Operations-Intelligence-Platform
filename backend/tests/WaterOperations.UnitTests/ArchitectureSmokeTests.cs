using Microsoft.Extensions.DependencyInjection;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Stations.Queries;
using WaterOperations.Application.Features.Viewer.Queries;

namespace WaterOperations.UnitTests;

public sealed class ArchitectureSmokeTests
{
    [Fact]
    public void CommandAndQueryTypesAreSealed()
    {
        var applicationAssembly = typeof(GetStationQuery).Assembly;
        var queryTypes = applicationAssembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract &&
                        (t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IQuery<>)) ||
                         t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>))));

        foreach (var type in queryTypes)
        {
            Assert.True(type.IsSealed, $"Type '{type.FullName}' should be marked as sealed.");
        }
    }

    [Fact]
    public void HandlersImplementCorrectInterfaces()
    {
        var applicationAssembly = typeof(GetStationQueryHandler).Assembly;
        var handlerTypes = applicationAssembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith("Handler", StringComparison.Ordinal));

        Assert.NotEmpty(handlerTypes);
        foreach (var handler in handlerTypes)
        {
            var isHandler = handler.GetInterfaces().Any(i =>
                i.IsGenericType &&
                (i.GetGenericTypeDefinition() == typeof(IQueryHandler<,>) ||
                 i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)));

            Assert.True(isHandler, $"Type '{handler.FullName}' should implement IQueryHandler or ICommandHandler.");
        }
    }
}
