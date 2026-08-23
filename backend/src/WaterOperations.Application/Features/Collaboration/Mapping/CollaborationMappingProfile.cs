using AutoMapper;
using WaterOperations.Application.Features.Collaboration.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Collaboration.Mapping;

/// <summary>
/// AutoMapper profile for collaboration notes and shared snapshots.
/// Real entity names: StationCollaborationNote and ShareSnapshot.
/// </summary>
public sealed class CollaborationMappingProfile : Profile
{
    public CollaborationMappingProfile()
    {
        CreateMap<StationCollaborationNote, CollaborationNoteDto>();

        CreateMap<ShareSnapshot, SharedSnapshotDto>()
            .ForMember(dest => dest.SnapshotId, opt => opt.MapFrom(src => src.ShareSnapshotId))
            .ForMember(dest => dest.Token, opt => opt.MapFrom(src => src.TokenHash));

        CreateMap<ShareSnapshot, SharedSnapshotContentDto>()
            .ForMember(dest => dest.SnapshotId, opt => opt.MapFrom(src => src.ShareSnapshotId));
    }
}
