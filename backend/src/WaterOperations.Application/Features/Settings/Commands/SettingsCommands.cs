using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;

namespace WaterOperations.Application.Features.Settings.Commands;

public sealed record SaveDashboardLayoutCommand(
    string LayoutName,
    string WidgetsJson,
    bool IsDefault) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record UpdateUserPreferencesCommand(
    string Theme,
    string Locale,
    string TimeZone,
    byte DecimalPrecision) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class SaveDashboardLayoutCommandValidator : AbstractValidator<SaveDashboardLayoutCommand>
{
    public SaveDashboardLayoutCommandValidator()
    {
        RuleFor(x => x.LayoutName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.WidgetsJson).NotEmpty().MaximumLength(500_000);
    }
}

public sealed class UpdateUserPreferencesCommandValidator : AbstractValidator<UpdateUserPreferencesCommand>
{
    public UpdateUserPreferencesCommandValidator()
    {
        RuleFor(x => x.Theme).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Locale).NotEmpty().MaximumLength(20);
        RuleFor(x => x.TimeZone).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DecimalPrecision).InclusiveBetween((byte)0, (byte)6);
    }
}

public sealed class SaveDashboardLayoutCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<SaveDashboardLayoutCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        SaveDashboardLayoutCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.SaveLayoutAsync(
            user.UserId!.Value,
            request.LayoutName,
            request.WidgetsJson,
            request.IsDefault,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class UpdateUserPreferencesCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<UpdateUserPreferencesCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        UpdateUserPreferencesCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.UpdateUserPreferencesAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Theme,
            request.Locale,
            request.TimeZone,
            request.DecimalPrecision,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
