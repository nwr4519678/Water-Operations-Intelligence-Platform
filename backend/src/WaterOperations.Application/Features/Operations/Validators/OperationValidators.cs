using FluentValidation;
using WaterOperations.Application.Features.Operations.Queries;

namespace WaterOperations.Application.Features.Operations.Validators;

public sealed class GetDataQualityQueryValidator : AbstractValidator<GetDataQualityQuery>
{
    public GetDataQualityQueryValidator()
    {
        RuleFor(x => x.Pagination.Page).GreaterThan(0);
        RuleFor(x => x.Pagination.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithErrorCode("invalid_time_range");
    }
}
