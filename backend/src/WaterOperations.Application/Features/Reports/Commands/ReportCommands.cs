using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.Reports.Contracts;
using WaterOperations.Application.Features.ProductCapabilities.Reports;

namespace WaterOperations.Application.Features.ProductCapabilities.Commands;

public sealed record CreateReportCommand(CreateReportRequest Request) : ICommand<ScopeResult<ReportDto>>, IRequireOrganization, IRequireUser;

public sealed class CreateReportCommandValidator : AbstractValidator<CreateReportCommand>
{
    public CreateReportCommandValidator()
    {
        RuleFor(x => x.Request.Format).Must(x => new[] { "CSV", "PDF", "XLSX" }.Contains(x.ToUpperInvariant()));
        RuleFor(x => x.Request.PeriodEndUtc).GreaterThan(x => x.Request.PeriodStartUtc);
        RuleFor(x => x.Request.PeriodEndUtc - x.Request.PeriodStartUtc).LessThanOrEqualTo(TimeSpan.FromDays(366));
    }
}

public sealed class CreateReportCommandHandler(IReportRepository repository, IReportJobScheduler scheduler, ICurrentUser currentUser) : ICommandHandler<CreateReportCommand, ScopeResult<ReportDto>>
{
    public async Task<ScopeResult<ReportDto>> Handle(CreateReportCommand request, CancellationToken cancellationToken)
    {
        var report = await repository.CreateReportAsync(currentUser.OrganizationId!.Value, currentUser.UserId!.Value, request.Request, cancellationToken);
        scheduler.Schedule(report.ReportId);
        return ScopeResult.Authorized(report);
    }
}
