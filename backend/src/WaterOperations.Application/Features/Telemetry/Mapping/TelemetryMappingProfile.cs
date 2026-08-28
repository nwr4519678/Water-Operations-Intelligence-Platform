using System.Globalization;
using AutoMapper;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Telemetry.Mapping;

/// <summary>
/// AutoMapper profile for telemetry measurement and chart data.
/// MeasurementClean.CanonicalUnit maps to the DTO's Unit field.
/// </summary>
public sealed class TelemetryMappingProfile : Profile
{
    public TelemetryMappingProfile()
    {
        // MeasurementClean → TelemetryPoint (query / export)
        CreateMap<MeasurementClean, TelemetryPoint>()
            .ForMember(dest => dest.Id,
                opt => opt.MapFrom(src => src.MeasurementCleanId.ToString(CultureInfo.InvariantCulture)))
            .ForMember(dest => dest.Unit,
                opt => opt.MapFrom(src => src.CanonicalUnit));

        // MeasurementClean → ChartPoint (visualisation)
        CreateMap<MeasurementClean, ChartPoint>()
            .ForMember(dest => dest.Unit,
                opt => opt.MapFrom(src => src.CanonicalUnit));
    }
}
