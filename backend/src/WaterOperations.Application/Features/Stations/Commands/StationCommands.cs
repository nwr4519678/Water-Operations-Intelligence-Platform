using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;
using WaterOperations.Application.Features.Stations.DTOs;

namespace WaterOperations.Application.Features.Stations.Commands;

public sealed record CreateStationCommand(CreateStationRequest Request)
    : ICommand<ScopeResult<StationDetailsDto>>, IRequireOrganization, IRequireUser;

public sealed record UpdateStationCommand(Guid StationId, UpdateStationRequest Request)
    : ICommand<ScopeResult<StationDetailsDto>>, IRequireOrganization, IRequireUser;

public sealed record SetStationActiveCommand(Guid StationId, bool IsActive)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record DeactivateStationCommand(Guid StationId)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record AssignStationParametersCommand(Guid StationId, IReadOnlyList<int> ParameterIds)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record CreateStationConnectionCommand(Guid UpstreamStationId, Guid DownstreamStationId, string ConnectionType)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class CreateStationCommandValidator : AbstractValidator<CreateStationCommand>
{
    public CreateStationCommandValidator()
    {
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.StationCode).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class UpdateStationCommandValidator : AbstractValidator<UpdateStationCommand>
{
    public UpdateStationCommandValidator()
    {
        RuleFor(x => x.StationId).NotEmpty();
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.StationCode).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class CreateStationCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<CreateStationCommand, ScopeResult<StationDetailsDto>>
{
    public async Task<ScopeResult<StationDetailsDto>> Handle(CreateStationCommand request, CancellationToken cancellationToken)
    {
        if (request.Request.RegionId.HasValue)
        {
            await authorizationService.DirectGuardRegionAsync(request.Request.RegionId.Value, cancellationToken);
        }

        var result = await repository.CreateStationAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.Request,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class UpdateStationCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<UpdateStationCommand, ScopeResult<StationDetailsDto>>
{
    public async Task<ScopeResult<StationDetailsDto>> Handle(UpdateStationCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        if (request.Request.RegionId.HasValue)
        {
            await authorizationService.DirectGuardRegionAsync(request.Request.RegionId.Value, cancellationToken);
        }

        var result = await repository.UpdateStationAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.Request,
            cancellationToken);

        return result is null ? ScopeResult.NotFound<StationDetailsDto>() : ScopeResult.Authorized(result);
    }
}

public sealed class SetStationActiveCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<SetStationActiveCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(SetStationActiveCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        var succeeded = await repository.SetStationActiveAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.IsActive,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class DeactivateStationCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<DeactivateStationCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(DeactivateStationCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        var succeeded = await repository.SetStationActiveAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            false,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class AssignStationParametersCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<AssignStationParametersCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(AssignStationParametersCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        var succeeded = await repository.AssignStationParametersAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.ParameterIds,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class CreateStationConnectionCommandHandler(
    IAdministrationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<CreateStationConnectionCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(CreateStationConnectionCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.UpstreamStationId, cancellationToken);
        await authorizationService.DirectGuardStationAsync(request.DownstreamStationId, cancellationToken);

        var succeeded = await repository.CreateStationConnectionAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.UpstreamStationId,
            request.DownstreamStationId,
            request.ConnectionType,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
