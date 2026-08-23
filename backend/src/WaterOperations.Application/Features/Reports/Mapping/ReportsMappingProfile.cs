using AutoMapper;
using WaterOperations.Application.Features.Reports.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Reports.Mapping;

/// <summary>
/// AutoMapper profile for generated reports and report schedules.
/// Real entity name: Report (not GeneratedReport).
/// </summary>
public sealed class ReportsMappingProfile : Profile
{
    public ReportsMappingProfile()
    {
        CreateMap<Report, ReportDto>();

        CreateMap<Report, ReportDownloadDto>()
            .ForMember(dest => dest.FilePath, opt => opt.MapFrom(src => src.FilePath ?? string.Empty))
            .ForMember(dest => dest.ContentType, opt => opt.MapFrom(src => GetContentType(src.Format)));

        CreateMap<ReportSchedule, ReportScheduleDto>()
            .ForMember(dest => dest.ScheduleId, opt => opt.MapFrom(src => src.ReportScheduleId));
    }

    public static string GetContentType(string? format)
    {
        var fmt = format?.ToUpperInvariant();
        if (fmt == "PDF") return "application/pdf";
        if (fmt is "EXCEL" or "XLSX") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return "text/csv";
    }
}
