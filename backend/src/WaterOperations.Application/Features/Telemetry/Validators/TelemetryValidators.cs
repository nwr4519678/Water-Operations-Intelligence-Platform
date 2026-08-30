using FluentValidation;
using WaterOperations.Application.Features.Telemetry.Queries;

namespace WaterOperations.Application.Features.Telemetry.Validators;

public sealed class GetTelemetryQueryValidator : AbstractValidator<GetTelemetryQuery>
{
    public GetTelemetryQueryValidator()
    {
        RuleFor(x => x.Limit).LessThanOrEqualTo(10_000).When(x => x.Limit.HasValue);
        RuleFor(x => x)
            .Must(x => !x.From.HasValue || !x.To.HasValue || x.From.Value <= x.To.Value)
            .WithMessage("From date must be earlier than or equal to To date.");
    }
}

public sealed class GetChartQueryValidator : AbstractValidator<GetChartQuery>
{
    public GetChartQueryValidator()
    {
        RuleFor(x => x.StationId).NotEmpty();
        RuleFor(x => x.Limit).InclusiveBetween(1, 10_000);
        RuleFor(x => x.From).LessThanOrEqualTo(x => x.To);
    }
}
