using AutoMapper;
using WaterOperations.Domain.Entities;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Mapping;

public sealed class ProductCapabilityMappingProfile : Profile
{
    public ProductCapabilityMappingProfile()
    {
        CreateMap<AnomalyEvent, AnomalyDto>();
        CreateMap<MlModel, ModelDto>();
        CreateMap<Report, ReportDto>();
        CreateMap<Notification, NotificationDto>();
        CreateMap<AuditLog, AuditEntryDto>();
        CreateMap<User, UserAdminDto>();
        CreateMap<Organization, OrganizationDto>();
        CreateMap<DashboardLayout, DashboardLayoutDto>();
    }
}
