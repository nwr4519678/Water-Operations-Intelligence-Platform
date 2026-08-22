using System.Reflection;
using WaterOperations.Api.Controllers;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.ArchitectureTests;

public sealed class LayerBoundaryTests
{
    [Fact]
    public void DomainDoesNotReferenceFrameworkOrTechnicalLayers()
    {
        var forbidden = ReferencedAssemblyNames(typeof(Organization).Assembly)
            .Where(name => name.StartsWith("Microsoft.", StringComparison.Ordinal)
                || name.StartsWith("System.Data", StringComparison.Ordinal)
                || name is "WaterOperations.Api" or "WaterOperations.Infrastructure")
            .ToArray();

        Assert.Empty(forbidden);
    }

    [Fact]
    public void ApplicationDoesNotReferenceInfrastructureOrApi()
    {
        var references = ReferencedAssemblyNames(typeof(IViewerQueryRepository).Assembly);

        Assert.DoesNotContain("WaterOperations.Infrastructure", references);
        Assert.DoesNotContain("WaterOperations.Api", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
    }

    [Fact]
    public void ViewerApplicationContractsDoNotExposeDomainEntities()
    {
        var contractTypes = new[]
        {
            typeof(IViewerQueryRepository),
            typeof(OrganizationDto),
            typeof(RegionDto),
            typeof(StationDto),
            typeof(MeasurementDto),
            typeof(AlarmDto)
        };

        var domainTypes = typeof(Organization).Assembly.GetTypes().ToHashSet();
        var exposedTypes = contractTypes.SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static))
            .SelectMany(method => new[] { method.ReturnType }.Concat(method.GetParameters().Select(parameter => parameter.ParameterType)))
            .Select(UnwrapTaskOrCollectionType)
            .ToArray();

        Assert.DoesNotContain(exposedTypes, domainTypes.Contains);
    }

    [Fact]
    public void ApiControllersDoNotDependOnEfDbContext()
    {
        var controllers = typeof(ViewerController).Assembly.GetTypes()
            .Where(type => type.Namespace == typeof(ViewerController).Namespace && type.Name.EndsWith("Controller", StringComparison.Ordinal));
        var parameters = controllers.SelectMany(type => type.GetConstructors().SelectMany(constructor => constructor.GetParameters()));
        Assert.DoesNotContain(parameters, parameter => parameter.ParameterType == typeof(WaterOperationsDbContext));
    }

    private static string[] ReferencedAssemblyNames(Assembly assembly) =>
        assembly.GetReferencedAssemblies().Select(name => name.Name!).ToArray();

    private static Type UnwrapTaskOrCollectionType(Type type)
    {
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Task<>))
        {
            return UnwrapTaskOrCollectionType(type.GetGenericArguments()[0]);
        }

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IReadOnlyList<>))
        {
            return UnwrapTaskOrCollectionType(type.GetGenericArguments()[0]);
        }

        return type;
    }
}
