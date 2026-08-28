using AutoMapper;
using WaterOperations.Application.Features.Audit.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Audit.Mapping;

/// <summary>
/// AutoMapper profile for audit log entities.
/// </summary>
public sealed class AuditMappingProfile : Profile
{
    public AuditMappingProfile()
    {
        CreateMap<AuditLog, AuditEntryDto>();
    }
}
