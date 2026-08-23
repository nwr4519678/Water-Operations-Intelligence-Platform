using FluentValidation;
using WaterOperations.Application.Features.Stations.Queries;

namespace WaterOperations.Application.Features.Stations.Validators;

public sealed class SearchStationsQueryValidator : AbstractValidator<SearchStationsQuery>
{
    public SearchStationsQueryValidator()
    {
        RuleFor(x => x.Pagination.Page).GreaterThan(0);
        RuleFor(x => x.Pagination.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.MinLatitude).InclusiveBetween(-90, 90).When(x => x.MinLatitude.HasValue);
        RuleFor(x => x.MaxLatitude).InclusiveBetween(-90, 90).When(x => x.MaxLatitude.HasValue);
        RuleFor(x => x.MinLongitude).InclusiveBetween(-180, 180).When(x => x.MinLongitude.HasValue);
        RuleFor(x => x.MaxLongitude).InclusiveBetween(-180, 180).When(x => x.MaxLongitude.HasValue);
        RuleFor(x => x.MaxLatitude)
            .GreaterThanOrEqualTo(x => x.MinLatitude!.Value)
            .When(x => x.MinLatitude.HasValue && x.MaxLatitude.HasValue);
        RuleFor(x => x.MaxLongitude)
            .GreaterThanOrEqualTo(x => x.MinLongitude!.Value)
            .When(x => x.MinLongitude.HasValue && x.MaxLongitude.HasValue);
    }
}
