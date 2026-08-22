using FluentValidation;
using WaterOperations.Application.Features.Mfa.Commands;

namespace WaterOperations.Application.Features.Mfa.Validators;

public sealed class VerifyMfaCommandValidator : AbstractValidator<VerifyMfaCommand>
{
    public VerifyMfaCommandValidator() => RuleFor(x => x.Code).NotEmpty();
}

public sealed class RecoverMfaCommandValidator : AbstractValidator<RecoverMfaCommand>
{
    public RecoverMfaCommandValidator() => RuleFor(x => x.Code).NotEmpty();
}
