using AutoMapper;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Notifications.Mapping;

/// <summary>
/// AutoMapper profile for user notifications and preferences.
/// Real entity names: Notification and NotificationPreference.
/// </summary>
public sealed class NotificationsMappingProfile : Profile
{
    public NotificationsMappingProfile()
    {
        CreateMap<Notification, NotificationDto>()
            .ForMember(dest => dest.NotificationLogId, opt => opt.MapFrom(src => src.NotificationId))
            .ForMember(dest => dest.IsRead, opt => opt.MapFrom(src => src.ReadAtUtc != null));

        CreateMap<NotificationPreference, NotificationPreferenceDto>();
    }
}
