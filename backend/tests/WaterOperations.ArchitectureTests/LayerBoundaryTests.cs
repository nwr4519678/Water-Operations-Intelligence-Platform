using System.Reflection;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Application.Features.Viewer.Interfaces;
using WaterOperations.Domain.Entities;

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
        var references = ReferencedAssemblyNames(typeof(IViewerReadService).Assembly);

        Assert.DoesNotContain("WaterOperations.Infrastructure", references);
        Assert.DoesNotContain("WaterOperations.Api", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
    }

    [Fact]
    public void ViewerApplicationContractsDoNotExposeDomainEntities()
    {
        var contractTypes = new[]
        {
            typeof(IViewerReadService),
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

    private static string[] ReferencedAssemblyNames(Assembly assembly) =>
        assembly.GetReferencedAssemblies().Select(name => name.Name!).ToArray();

    private static Type UnwrapTaskOrCollectionType(Type type)
    {
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Task<>))
            return UnwrapTaskOrCollectionType(type.GetGenericArguments()[0]);

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IReadOnlyList<>))
            return UnwrapTaskOrCollectionType(type.GetGenericArguments()[0]);

        return type;
    }
}
