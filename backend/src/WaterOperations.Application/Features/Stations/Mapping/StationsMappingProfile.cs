using AutoMapper;
using WaterOperations.Application.Features.Stations.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Stations.Mapping;

/// <summary>
/// AutoMapper profile for station list and detail DTOs.
/// </summary>
public sealed class StationsMappingProfile : Profile
{
    public StationsMappingProfile()
    {
        // Station → list row (lightweight)
        CreateMap<Station, StationListItemDto>();

        // Station → full details including nested parameter list
        CreateMap<Station, StationDetailsDto>()
            .ForMember(dest => dest.Parameters,
                opt => opt.MapFrom(src => src.StationParameters));

        // StationParameter → small DTO
        CreateMap<StationParameter, StationParameterDto>();
    }
}
