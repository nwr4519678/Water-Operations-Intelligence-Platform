using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.Alarms.Interfaces;
using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Alarms.Commands;

public sealed record AcknowledgeAlarmCommand(Guid AlarmId)
    : ICommand<ScopeResult<AlarmDto>>, IRequireOrganization, IRequireUser;

public sealed record ResolveAlarmCommand(Guid AlarmId, string? ResolutionNote)
    : ICommand<ScopeResult<AlarmDto>>, IRequireOrganization, IRequireUser;

public sealed record ReopenAlarmCommand(Guid AlarmId)
    : ICommand<ScopeResult<AlarmDto>>, IRequireOrganization, IRequireUser;

public sealed record TagAlarmLabelCommand(Guid AlarmId, string Label, decimal Confidence)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class ResolveAlarmCommandValidator : AbstractValidator<ResolveAlarmCommand>
{
    public ResolveAlarmCommandValidator()
    {
        RuleFor(x => x.AlarmId).NotEmpty();
        RuleFor(x => x.ResolutionNote).MaximumLength(2000);
    }
}

public sealed class TagAlarmLabelCommandValidator : AbstractValidator<TagAlarmLabelCommand>
{
    public TagAlarmLabelCommandValidator()
    {
        RuleFor(x => x.AlarmId).NotEmpty();
        RuleFor(x => x.Label).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Confidence).InclusiveBetween(0m, 1m);
    }
}

public sealed class AcknowledgeAlarmCommandHandler(
    IAlarmRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<AcknowledgeAlarmCommand, ScopeResult<AlarmDto>>
{
    public async Task<ScopeResult<AlarmDto>> Handle(AcknowledgeAlarmCommand request, CancellationToken cancellationToken)
    {
        var existing = await repository.GetByIdAsync(user.OrganizationId!.Value, request.AlarmId, cancellationToken);
        if (existing == null)
        {
            return ScopeResult.NotFound<AlarmDto>();
        }

        await authorizationService.DirectGuardStationAsync(existing.StationId, cancellationToken);

        var result = await repository.AcknowledgeAsync(
            user.OrganizationId!.Value,
            request.AlarmId,
            user.UserId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class ResolveAlarmCommandHandler(
    IAlarmRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<ResolveAlarmCommand, ScopeResult<AlarmDto>>
{
    public async Task<ScopeResult<AlarmDto>> Handle(ResolveAlarmCommand request, CancellationToken cancellationToken)
    {
        var existing = await repository.GetByIdAsync(user.OrganizationId!.Value, request.AlarmId, cancellationToken);
        if (existing == null)
        {
            return ScopeResult.NotFound<AlarmDto>();
        }

        await authorizationService.DirectGuardStationAsync(existing.StationId, cancellationToken);

        var result = await repository.ResolveAsync(
            user.OrganizationId!.Value,
            request.AlarmId,
            user.UserId!.Value,
            request.ResolutionNote,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class ReopenAlarmCommandHandler(
    IAlarmRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<ReopenAlarmCommand, ScopeResult<AlarmDto>>
{
    public async Task<ScopeResult<AlarmDto>> Handle(ReopenAlarmCommand request, CancellationToken cancellationToken)
    {
        var existing = await repository.GetByIdAsync(user.OrganizationId!.Value, request.AlarmId, cancellationToken);
        if (existing == null)
        {
            return ScopeResult.NotFound<AlarmDto>();
        }

        await authorizationService.DirectGuardStationAsync(existing.StationId, cancellationToken);

        var result = await repository.ReopenAsync(
            user.OrganizationId!.Value,
            request.AlarmId,
            user.UserId!.Value,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class TagAlarmLabelCommandHandler(
    IAlarmRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<TagAlarmLabelCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(TagAlarmLabelCommand request, CancellationToken cancellationToken)
    {
        var existing = await repository.GetByIdAsync(user.OrganizationId!.Value, request.AlarmId, cancellationToken);
        if (existing == null)
        {
            return ScopeResult.NotFound<bool>();
        }

        await authorizationService.DirectGuardStationAsync(existing.StationId, cancellationToken);

        var succeeded = await repository.AddLabelAsync(
            request.AlarmId,
            user.UserId!.Value,
            request.Label,
            request.Confidence,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
