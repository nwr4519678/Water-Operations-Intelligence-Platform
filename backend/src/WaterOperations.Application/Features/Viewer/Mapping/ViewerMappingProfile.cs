using AutoMapper;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Viewer.Mapping;

/// <summary>
/// AutoMapper profile for viewer-facing UI aggregation DTOs.
/// Maps domain entities to lightweight viewer response records.
/// </summary>
public sealed class ViewerMappingProfile : Profile
{
    public ViewerMappingProfile()
    {
        CreateMap<Organization, OrganizationDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.OrganizationId));

        CreateMap<Region, RegionDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.RegionId));

        CreateMap<Station, StationDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.StationId))
            .ForMember(dest => dest.RegionId, opt => opt.MapFrom(src => src.RegionId ?? Guid.Empty));

        CreateMap<MeasurementClean, MeasurementDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.MeasurementCleanId))
            .ForMember(dest => dest.RecordedAt, opt => opt.MapFrom(src => src.TimestampUtc));

        CreateMap<Alarm, AlarmDto>()
            .ForMember(dest => dest.AlarmId, opt => opt.MapFrom(src => src.AlarmId))
            .ForMember(dest => dest.RaisedAtUtc, opt => opt.MapFrom(src => src.RaisedAtUtc));
    }
}
