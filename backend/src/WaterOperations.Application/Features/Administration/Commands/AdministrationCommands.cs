using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;

namespace WaterOperations.Application.Features.Administration.Commands;

public sealed record CreateRegionCommand(
    CreateRegionRequest Request) : ICommand<ScopeResult<RegionAdminDto>>, IRequireOrganization, IRequireUser;

public sealed record UpdateRegionCommand(
    Guid RegionId,
    UpdateRegionRequest Request) : ICommand<ScopeResult<RegionAdminDto>>, IRequireOrganization, IRequireUser;

public sealed record SetRegionActiveCommand(
    Guid RegionId,
    bool IsActive) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record AssignUserRoleCommand(
    Guid UserId,
    int RoleId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record RevokeUserSessionsCommand(
    Guid UserId) : ICommand<ScopeResult<int>>, IRequireOrganization, IRequireUser;

public sealed record UpdateOrganizationCommand(
    string Name,
    string? LogoUrl,
    string Locale,
    string TimeZone) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record SetUserActiveCommand(
    Guid UserId,
    bool IsActive) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class CreateRegionCommandValidator : AbstractValidator<CreateRegionCommand>
{
    public CreateRegionCommandValidator()
    {
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class UpdateRegionCommandValidator : AbstractValidator<UpdateRegionCommand>
{
    public UpdateRegionCommandValidator()
    {
        RuleFor(x => x.RegionId).NotEmpty();
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class AssignUserRoleCommandValidator : AbstractValidator<AssignUserRoleCommand>
{
    public AssignUserRoleCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.RoleId).GreaterThan(0);
    }
}

public sealed class CreateRegionCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<CreateRegionCommand, ScopeResult<RegionAdminDto>>
{
    public async Task<ScopeResult<RegionAdminDto>> Handle(
        CreateRegionCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.CreateRegionAsync(
            user.OrganizationId!.Value,
            request.Request,
            cancellationToken);

        return result is null
            ? ScopeResult.NotFound<RegionAdminDto>()
            : ScopeResult.Authorized(result);
    }
}

public sealed class UpdateRegionCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<UpdateRegionCommand, ScopeResult<RegionAdminDto>>
{
    public async Task<ScopeResult<RegionAdminDto>> Handle(
        UpdateRegionCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.UpdateRegionAsync(
            user.OrganizationId!.Value,
            request.RegionId,
            request.Request,
            cancellationToken);

        return result is null
            ? ScopeResult.NotFound<RegionAdminDto>()
            : ScopeResult.Authorized(result);
    }
}

public sealed class SetRegionActiveCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<SetRegionActiveCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        SetRegionActiveCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.SetRegionActiveAsync(
            user.OrganizationId!.Value,
            request.RegionId,
            request.IsActive,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class AssignUserRoleCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<AssignUserRoleCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        AssignUserRoleCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.AssignUserRoleAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.UserId,
            request.RoleId,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class RevokeUserSessionsCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<RevokeUserSessionsCommand, ScopeResult<int>>
{
    public async Task<ScopeResult<int>> Handle(
        RevokeUserSessionsCommand request,
        CancellationToken cancellationToken)
    {
        var count = await repository.RevokeUserSessionsAsync(
            user.OrganizationId!.Value,
            request.UserId,
            cancellationToken);

        return ScopeResult.Authorized(count);
    }
}

public sealed class UpdateOrganizationCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<UpdateOrganizationCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        UpdateOrganizationCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.UpdateOrganizationAsync(
            user.OrganizationId!.Value,
            request.Name,
            request.LogoUrl,
            request.Locale,
            request.TimeZone,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class SetUserActiveCommandHandler(
    IAdministrationRepository repository,
    ICurrentUser user) : ICommandHandler<SetUserActiveCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        SetUserActiveCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.SetUserActiveAsync(
            user.OrganizationId!.Value,
            request.UserId,
            request.IsActive,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
