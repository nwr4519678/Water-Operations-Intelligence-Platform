using FluentValidation;
using WaterOperations.Application.Features.Telemetry.Queries;

namespace WaterOperations.Application.Features.Telemetry.Validators;

public sealed class GetChartQueryValidator : AbstractValidator<GetChartQuery>
{
    public GetChartQueryValidator()
    {
        RuleFor(x => x.To)
            .GreaterThan(x => x.From)
            .WithErrorCode("invalid_time_range")
            .WithMessage("The end of the time range must be after its start.");
        RuleFor(x => x.Limit).InclusiveBetween(1, 10_000);
    }
}

public sealed class GetTelemetryQueryValidator : AbstractValidator<GetTelemetryQuery>
{
    public GetTelemetryQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 1_000)
            .When(x => x.Limit.HasValue);
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithErrorCode("invalid_time_range");
    }
}
