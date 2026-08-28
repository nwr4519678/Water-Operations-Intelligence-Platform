using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Notifications.DTOs;
using WaterOperations.Application.Features.Notifications.Interfaces;

namespace WaterOperations.Application.Features.Notifications.Commands;

public sealed record MarkNotificationReadCommand(
    long NotificationId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record SaveNotificationPreferenceCommand(
    NotificationPreferenceDto Preference) : ICommand<ScopeResult<bool>>, 
    IRequireOrganization, IRequireUser;

public sealed class MarkNotificationReadCommandValidator :
    AbstractValidator<MarkNotificationReadCommand>
{
    public MarkNotificationReadCommandValidator()
    {
        RuleFor(x => x.NotificationId).GreaterThan(0);
    }
}

public sealed class SaveNotificationPreferenceCommandValidator : 
    AbstractValidator<SaveNotificationPreferenceCommand>
{
    public SaveNotificationPreferenceCommandValidator()
    {
        RuleFor(x => x.Preference).NotNull();
        RuleFor(x => x.Preference.Severity).NotEmpty().MaximumLength(50);
    }
}

public sealed class MarkNotificationReadCommandHandler(
    INotificationRepository repository,
    ICurrentUser user) : ICommandHandler<MarkNotificationReadCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        MarkNotificationReadCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.MarkNotificationReadAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.NotificationId,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class SaveNotificationPreferenceCommandHandler(
    INotificationRepository repository,
    ICurrentUser user) : ICommandHandler<SaveNotificationPreferenceCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        SaveNotificationPreferenceCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.SaveNotificationPreferenceAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Preference,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
