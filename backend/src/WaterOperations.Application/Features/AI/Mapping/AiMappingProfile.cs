using AutoMapper;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.AI.Mapping;

/// <summary>
/// AutoMapper profile for AI anomalies and model registry entities.
/// Real entity names: AnomalyEvent (not AiAnomaly), MlModel (not AiModelRegistry).
/// </summary>
public sealed class AiMappingProfile : Profile
{
    public AiMappingProfile()
    {
        // AnomalyEvent → AnomalyDto (field names match by convention)
        CreateMap<AnomalyEvent, AnomalyDto>()
            .ForMember(dest => dest.Id,
                opt => opt.MapFrom(src => src.AnomalyEventId));

        // MlModel → ModelDto (field names match by convention)
        CreateMap<MlModel, ModelDto>();
    }
}
