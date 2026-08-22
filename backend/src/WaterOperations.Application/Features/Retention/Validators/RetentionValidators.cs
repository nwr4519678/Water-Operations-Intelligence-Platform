using FluentValidation;
using WaterOperations.Application.Features.Retention.Commands;

namespace WaterOperations.Application.Features.Retention.Validators;

public sealed class DryRunRetentionCommandValidator : AbstractValidator<DryRunRetentionCommand>
{
    public DryRunRetentionCommandValidator() => RuleFor(x => x.OlderThanDays).GreaterThan(0);
}

public sealed class ExecuteRetentionCommandValidator : AbstractValidator<ExecuteRetentionCommand>
{
    public ExecuteRetentionCommandValidator()
    {
        RuleFor(x => x.Request)
            .NotNull()
            .ChildRules(request => request.RuleFor(x => x.OlderThanDays).GreaterThan(0));
    }
}
