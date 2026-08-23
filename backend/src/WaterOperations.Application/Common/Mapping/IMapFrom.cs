using AutoMapper;

namespace WaterOperations.Application.Common.Mapping;

public interface IMapFrom<in TSource>
{
    public void Mapping(Profile profile) => profile.CreateMap(typeof(TSource), GetType());
}
