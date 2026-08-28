using AutoMapper;
using WaterOperations.Application.Features.Search.DTOs;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Search.Mapping;

/// <summary>
/// AutoMapper profile for cross-domain search results.
/// Real entity names: Station, Alarm, User.
/// </summary>
public sealed class SearchMappingProfile : Profile
{
    public SearchMappingProfile()
    {
        CreateMap<Station, SearchResultDto>()
            .ConstructUsing(s => new SearchResultDto("Station", s.StationId.ToString(), s.Name, s.StationCode));

        CreateMap<Alarm, SearchResultDto>()
            .ConstructUsing(a => new SearchResultDto("Alarm", a.AlarmId.ToString(), a.Message, a.Severity));

        CreateMap<User, SearchResultDto>()
            .ConstructUsing(u => new SearchResultDto("User", u.UserId.ToString(), u.DisplayName, u.Email));
    }
}
