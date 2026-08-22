using FluentValidation;
using WaterOperations.Application.Features.Ingestion.Commands;

namespace WaterOperations.Application.Features.Ingestion.Validators;

public sealed class IngestBatchCommandValidator : AbstractValidator<IngestBatchCommand>
{
    public IngestBatchCommandValidator()
    {
        RuleFor(x => x.Request)
            .NotNull()
            .ChildRules(request =>
            {
                request.RuleFor(x => x.Readings)
                    .NotEmpty()
                    .Must(x => x.Count <= 10_000);
            });
    }
}

public sealed class ImportCsvCommandValidator : AbstractValidator<ImportCsvCommand>
{
    public ImportCsvCommandValidator()
    {
        RuleFor(x => x.Content).NotNull();
        RuleFor(x => x.FileName)
            .NotEmpty()
            .Must(fileName => string.Equals(
                Path.GetExtension(fileName),
                ".csv",
                StringComparison.OrdinalIgnoreCase))
            .WithErrorCode("csv_required");
        RuleFor(x => x.Length)
            .InclusiveBetween(1, 25_000_000)
            .WithErrorCode("invalid_file");
    }
}
