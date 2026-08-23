using AutoMapper;
using WaterOperations.Application.Features.Pipeline.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Pipeline.Mapping;

/// <summary>
/// AutoMapper profile for pipeline data cleaning batch DTOs.
/// Maps MeasurementClean → CleanRowDto for outbound representations.
/// </summary>
public sealed class PipelineMappingProfile : Profile
{
    public PipelineMappingProfile()
    {
        // MeasurementClean → CleanRowDto
        CreateMap<MeasurementClean, CleanRowDto>()
            .ForMember(dest => dest.Unit,
                opt => opt.MapFrom(src => src.CanonicalUnit))
            .ForMember(dest => dest.SourceRawId,
                opt => opt.MapFrom(src => src.SourceRawId ?? 0L));
    }
}
