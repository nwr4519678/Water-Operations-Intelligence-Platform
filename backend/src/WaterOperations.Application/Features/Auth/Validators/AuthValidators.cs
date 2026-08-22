using FluentValidation;
using WaterOperations.Application.Features.Auth.Commands;

namespace WaterOperations.Application.Features.Auth.Validators;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Request)
            .NotNull()
            .ChildRules(request =>
            {
                request.RuleFor(x => x.Email).NotEmpty().EmailAddress();
                request.RuleFor(x => x.Password).NotEmpty();
            });
    }
}

public sealed class RefreshCommandValidator : AbstractValidator<RefreshCommand>
{
    public RefreshCommandValidator() => RuleFor(x => x.RefreshToken).NotEmpty();
}

public sealed class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator() => RuleFor(x => x.RefreshToken).NotEmpty();
}
