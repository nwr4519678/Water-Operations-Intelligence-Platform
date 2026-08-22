using AutoMapper;
using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Application.Features.Telemetry.Mapping;

public sealed class TelemetryMappingProfile : Profile
{
    public TelemetryMappingProfile()
    {
        CreateMap<TelemetryPoint, TelemetryItem>()
            .ForMember(destination => destination.Id,
                options => options.MapFrom(source => ParseId(source.Id)));
    }

    private static long ParseId(string id) => long.TryParse(id, out var value) ? value : 0L;
}
