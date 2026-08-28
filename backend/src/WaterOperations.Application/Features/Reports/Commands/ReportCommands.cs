using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Reports.DTOs;
using WaterOperations.Application.Features.Reports.Interfaces;

namespace WaterOperations.Application.Features.Reports.Commands;

public sealed record CreateReportCommand(
    CreateReportRequest Request) : ICommand<ScopeResult<ReportDto>>, IRequireOrganization, IRequireUser;

public sealed record CreateReportScheduleCommand(
    string Frequency,
    string Format,
    string RecipientJson,
    DateTime NextRunAtUtc) : ICommand<ScopeResult<ReportScheduleDto>>, IRequireOrganization, IRequireUser;

public sealed record SetReportScheduleActiveCommand(
    long ScheduleId,
    bool IsActive) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class CreateReportCommandValidator : AbstractValidator<CreateReportCommand>
{
    public CreateReportCommandValidator()
    {
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.Format).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Request.PeriodEndUtc).GreaterThan(x => x.Request.PeriodStartUtc);
    }
}

public sealed class CreateReportScheduleCommandValidator : AbstractValidator<CreateReportScheduleCommand>
{
    public CreateReportScheduleCommandValidator()
    {
        RuleFor(x => x.Frequency).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Format).NotEmpty().MaximumLength(20);
        RuleFor(x => x.RecipientJson).NotEmpty();
        RuleFor(x => x.NextRunAtUtc).GreaterThan(DateTime.UtcNow.AddMinutes(-5));
    }
}

public sealed class SetReportScheduleActiveCommandValidator : AbstractValidator<SetReportScheduleActiveCommand>
{
    public SetReportScheduleActiveCommandValidator()
    {
        RuleFor(x => x.ScheduleId).GreaterThan(0);
    }
}

public sealed class CreateReportCommandHandler(
    IReportRepository repository,
    IReportJobScheduler scheduler,
    ICurrentUser user) : ICommandHandler<CreateReportCommand, ScopeResult<ReportDto>>
{
    public async Task<ScopeResult<ReportDto>> Handle(
        CreateReportCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.CreateReportAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Request,
            cancellationToken);

        scheduler.Schedule(result.ReportId);
        return ScopeResult.Authorized(result);
    }
}

public sealed class CreateReportScheduleCommandHandler(
    IReportRepository repository,
    IReportJobScheduler scheduler,
    ICurrentUser user) : ICommandHandler<CreateReportScheduleCommand, ScopeResult<ReportScheduleDto>>
{
    public async Task<ScopeResult<ReportScheduleDto>> Handle(
        CreateReportScheduleCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.CreateReportScheduleAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Frequency,
            request.Format,
            request.RecipientJson,
            request.NextRunAtUtc,
            cancellationToken);

        scheduler.ScheduleRecurring(result.ScheduleId, result.Frequency);
        return ScopeResult.Authorized(result);
    }
}

public sealed class SetReportScheduleActiveCommandHandler(
    IReportRepository repository,
    ICurrentUser user) : ICommandHandler<SetReportScheduleActiveCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        SetReportScheduleActiveCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.SetReportScheduleActiveAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.ScheduleId,
            request.IsActive,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
