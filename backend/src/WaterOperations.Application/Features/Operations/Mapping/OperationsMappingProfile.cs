using AutoMapper;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Operations.Mapping;

/// <summary>
/// AutoMapper profile for operational overview and data quality DTOs.
/// DataQualityLog already has precomputed Pct columns — no calculation needed.
/// </summary>
public sealed class OperationsMappingProfile : Profile
{
    public OperationsMappingProfile()
    {
        // DataQualityLog → DataQualityDto (percentages are stored columns)
        CreateMap<DataQualityLog, DataQualityDto>();
    }
}
