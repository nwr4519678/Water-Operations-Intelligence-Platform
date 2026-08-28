using AutoMapper;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Administration.Mapping;

/// <summary>
/// AutoMapper profile for administration entities (users, organizations, regions, layouts, preferences).
/// Real entity names: User (not UserAccount), User.PreferredLocale/Theme/... (not UserPreference entity).
/// </summary>
public sealed class AdministrationMappingProfile : Profile
{
    public AdministrationMappingProfile()
    {
        // User → UserAdminDto
        CreateMap<User, UserAdminDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.DisplayName))
            .ForMember(dest => dest.ClientType, opt => opt.MapFrom(src => src.ClientType))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
            .ForMember(dest => dest.CreatedAtUtc, opt => opt.MapFrom(src => src.CreatedAtUtc));

        // Organization → OrganizationDto (names match by convention)
        CreateMap<Organization, OrganizationDto>()
            .ForMember(dest => dest.DefaultLocale, opt => opt.MapFrom(src => src.DefaultLocale))
            .ForMember(dest => dest.DefaultTimeZone, opt => opt.MapFrom(src => src.DefaultTimeZone));

        // Region → RegionAdminDto (field names match)
        CreateMap<Region, RegionAdminDto>();

        // DashboardLayout → DashboardLayoutDto
        CreateMap<DashboardLayout, DashboardLayoutDto>();

        // User preferences are scalar columns on User — assembled by the repository, no AutoMapper needed.
        // UserPreferencesDto is built in EfAdministrationRepository.GetUserPreferencesAsync directly.
    }
}
