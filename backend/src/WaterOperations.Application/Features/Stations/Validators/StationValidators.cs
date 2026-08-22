using FluentValidation;
using WaterOperations.Application.Features.Stations.Queries;

namespace WaterOperations.Application.Features.Stations.Validators;

public sealed class SearchStationsQueryValidator : AbstractValidator<SearchStationsQuery>
{
    public SearchStationsQueryValidator()
    {
        RuleFor(x => x.Pagination.Page).GreaterThan(0);
        RuleFor(x => x.Pagination.PageSize).InclusiveBetween(1, 100);
    }
}
