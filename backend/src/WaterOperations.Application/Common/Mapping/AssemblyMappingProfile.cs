using System.Reflection;
using AutoMapper;

namespace WaterOperations.Application.Common.Mapping;

/// <summary>
/// AutoMapper profile that scans the Application assembly and registers all
/// maps declared via <see cref="IMapFrom{TSource}"/> and <see cref="IMapTo{TTarget}"/>.
///
/// Two strategies are used:
/// <list type="number">
///   <item>
///     For concrete classes (classes with a parameterless constructor), the default
///     interface <c>Mapping(Profile)</c> method is invoked so implementors can
///     customise the map inline.
///   </item>
///   <item>
///     For records and other types without a parameterless constructor, the map is
///     registered directly from the generic argument — no instantiation required.
///   </item>
/// </list>
/// </summary>
public sealed class AssemblyMappingProfile : Profile
{
    public AssemblyMappingProfile()
        : this(Assembly.GetExecutingAssembly()) { }

    /// <param name="assembly">Assembly to scan (useful for unit testing).</param>
    public AssemblyMappingProfile(Assembly assembly)
    {
        var mapFromDef = typeof(IMapFrom<>);
        var mapToDef   = typeof(IMapTo<>);

        var concreteTypes = assembly
            .GetExportedTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface)
            .ToList();

        foreach (var type in concreteTypes)
        {
            foreach (var iface in type.GetInterfaces())
            {
                if (!iface.IsGenericType) continue;

                var def = iface.GetGenericTypeDefinition();

                if (def != mapFromDef && def != mapToDef) continue;

                var genericArg = iface.GetGenericArguments()[0];

                bool isMapFrom = def == mapFromDef;

                // Try to invoke the overridable Mapping(Profile) method.
                // This works for classes with a parameterless constructor.
                var ctor = type.GetConstructor(Type.EmptyTypes);
                if (ctor is not null)
                {
                    var instance   = ctor.Invoke(null);
                    var methodInfo = iface.GetMethod("Mapping") ?? type.GetMethod("Mapping");
                    methodInfo?.Invoke(instance, [this]);
                }
                else
                {
                    // Records / value types — register the map directly.
                    if (isMapFrom)
                        CreateMap(genericArg, type);
                    else
                        CreateMap(type, genericArg);
                }
            }
        }
    }
}
