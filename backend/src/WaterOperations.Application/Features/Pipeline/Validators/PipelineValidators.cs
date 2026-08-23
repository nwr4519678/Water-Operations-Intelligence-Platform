using FluentValidation;
using WaterOperations.Application.Features.Pipeline.Commands;

namespace WaterOperations.Application.Features.Pipeline.Validators;

public sealed class PublishCleanBatchCommandValidator : AbstractValidator<PublishCleanBatchCommand>
{
    public PublishCleanBatchCommandValidator()
    {
        RuleFor(x => x.Request)
            .NotNull()
            .ChildRules(request =>
            {
                request.RuleFor(x => x.RulesetVersion).NotEmpty();
                request.RuleFor(x => x.Rows)
                    .NotNull()
                    .Must(x => x.Count <= 10_000);
            });
    }
}
