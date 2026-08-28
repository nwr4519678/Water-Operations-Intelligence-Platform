using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.Thresholds.DTOs;
using WaterOperations.Application.Features.Thresholds.Interfaces;

namespace WaterOperations.Application.Features.Thresholds.Commands;

public sealed record CreateThresholdCommand(CreateThresholdRequest Request)
    : ICommand<ScopeResult<ThresholdDto>>, IRequireOrganization, IRequireUser;

public sealed record UpdateThresholdCommand(long ThresholdId, UpdateThresholdRequest Request)
    : ICommand<ScopeResult<ThresholdDto>>, IRequireOrganization, IRequireUser;

public sealed record DeactivateThresholdCommand(long ThresholdId)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class CreateThresholdCommandValidator : AbstractValidator<CreateThresholdCommand>
{
    public CreateThresholdCommandValidator()
    {
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.StationId).NotEmpty();
        RuleFor(x => x.Request.ParameterId).GreaterThan(0);
        RuleFor(x => x)
            .Must(x => ValidateNumericHierarchy(x.Request.CriticalLow, x.Request.WarningLow, x.Request.WarningHigh, x.Request.CriticalHigh))
            .WithMessage("Threshold numeric hierarchy rule violated: CriticalLow <= WarningLow < WarningHigh <= CriticalHigh");
    }

    private static bool ValidateNumericHierarchy(decimal? cLow, decimal? wLow, decimal? wHigh, decimal? cHigh)
    {
        if (cLow.HasValue && wLow.HasValue && cLow.Value > wLow.Value) return false;
        if (wLow.HasValue && wHigh.HasValue && wLow.Value >= wHigh.Value) return false;
        if (wHigh.HasValue && cHigh.HasValue && wHigh.Value > cHigh.Value) return false;
        return true;
    }
}

public sealed class UpdateThresholdCommandValidator : AbstractValidator<UpdateThresholdCommand>
{
    public UpdateThresholdCommandValidator()
    {
        RuleFor(x => x.ThresholdId).GreaterThan(0);
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x)
            .Must(x => ValidateNumericHierarchy(x.Request.CriticalLow, x.Request.WarningLow, x.Request.WarningHigh, x.Request.CriticalHigh))
            .WithMessage("Threshold numeric hierarchy rule violated: CriticalLow <= WarningLow < WarningHigh <= CriticalHigh");
    }

    private static bool ValidateNumericHierarchy(decimal? cLow, decimal? wLow, decimal? wHigh, decimal? cHigh)
    {
        if (cLow.HasValue && wLow.HasValue && cLow.Value > wLow.Value) return false;
        if (wLow.HasValue && wHigh.HasValue && wLow.Value >= wHigh.Value) return false;
        if (wHigh.HasValue && cHigh.HasValue && wHigh.Value > cHigh.Value) return false;
        return true;
    }
}

public sealed class CreateThresholdCommandHandler(
    IThresholdRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<CreateThresholdCommand, ScopeResult<ThresholdDto>>
{
    public async Task<ScopeResult<ThresholdDto>> Handle(CreateThresholdCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.Request.StationId, cancellationToken);

        var result = await repository.CreateAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Request,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class UpdateThresholdCommandHandler(
    IThresholdRepository repository,
    ICurrentUser user) : ICommandHandler<UpdateThresholdCommand, ScopeResult<ThresholdDto>>
{
    public async Task<ScopeResult<ThresholdDto>> Handle(UpdateThresholdCommand request, CancellationToken cancellationToken)
    {
        var result = await repository.UpdateAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.ThresholdId,
            request.Request,
            cancellationToken);

        return result is null
            ? ScopeResult.NotFound<ThresholdDto>()
            : ScopeResult.Authorized(result);
    }
}

public sealed class DeactivateThresholdCommandHandler(
    IThresholdRepository repository,
    ICurrentUser user) : ICommandHandler<DeactivateThresholdCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(DeactivateThresholdCommand request, CancellationToken cancellationToken)
    {
        var succeeded = await repository.DeactivateAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.ThresholdId,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
