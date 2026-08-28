using AutoMapper;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Ingestion.Mapping;

/// <summary>
/// AutoMapper profile for ingestion batch DTOs.
/// Maps the <see cref="IngestionBatch"/> EF entity to response records.
/// </summary>
public sealed class IngestionMappingProfile : Profile
{
    public IngestionMappingProfile()
    {
        // IngestionBatch → BatchDetails (query response)
        CreateMap<IngestionBatch, BatchDetails>()
            .ForMember(dest => dest.IngestionBatchId,
                opt => opt.MapFrom(src => src.IngestionBatchId));

        // IngestionBatch → IngestionResult (command response)
        CreateMap<IngestionBatch, IngestionResult>()
            .ForMember(dest => dest.BatchId,
                opt => opt.MapFrom(src => src.IngestionBatchId))
            .ForMember(dest => dest.Duplicate,
                opt => opt.MapFrom(src => src.Status == "DUPLICATE"));
    }
}
