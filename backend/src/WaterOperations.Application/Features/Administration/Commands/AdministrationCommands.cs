using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Administration.Contracts;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.Administration.Commands;

public sealed record CreateRegionCommand(CreateRegionRequest Request) : ICommand<ScopeResult<RegionAdminDto>>, IRequireOrganization;
public sealed record UpdateRegionCommand(Guid RegionId, UpdateRegionRequest Request) : ICommand<ScopeResult<RegionAdminDto>>, IRequireOrganization;
public sealed record SetRegionActiveCommand(Guid RegionId, bool IsActive) : ICommand<ScopeResult<bool>>, IRequireOrganization;
public sealed record AssignUserRoleCommand(Guid UserId, int RoleId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record RevokeUserSessionsCommand(Guid UserId) : ICommand<ScopeResult<int>>, IRequireOrganization, IRequireUser;

public sealed class CreateRegionCommandValidator : AbstractValidator<CreateRegionCommand>
{
    public CreateRegionCommandValidator() { RuleFor(x => x.Request.Code).NotEmpty().MaximumLength(50); RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200); RuleFor(x => x.Request.Description).MaximumLength(2000); RuleFor(x => x.Request.BoundaryJson).MaximumLength(1_000_000); }
}
public sealed class UpdateRegionCommandValidator : AbstractValidator<UpdateRegionCommand>
{
    public UpdateRegionCommandValidator() { RuleFor(x => x.RegionId).NotEmpty(); RuleFor(x => x.Request.Code).NotEmpty().MaximumLength(50); RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200); RuleFor(x => x.Request.Description).MaximumLength(2000); RuleFor(x => x.Request.BoundaryJson).MaximumLength(1_000_000); }
}
public sealed class SetRegionActiveCommandValidator : AbstractValidator<SetRegionActiveCommand> { public SetRegionActiveCommandValidator() => RuleFor(x => x.RegionId).NotEmpty(); }
public sealed class AssignUserRoleCommandValidator : AbstractValidator<AssignUserRoleCommand> { public AssignUserRoleCommandValidator() { RuleFor(x => x.UserId).NotEmpty(); RuleFor(x => x.RoleId).GreaterThan(0); } }
public sealed class RevokeUserSessionsCommandValidator : AbstractValidator<RevokeUserSessionsCommand> { public RevokeUserSessionsCommandValidator() => RuleFor(x => x.UserId).NotEmpty(); }

public sealed class CreateRegionCommandHandler(IAdministrationRepository repository, ICurrentUser user) : ICommandHandler<CreateRegionCommand, ScopeResult<RegionAdminDto>>
{
    public async Task<ScopeResult<RegionAdminDto>> Handle(CreateRegionCommand request, CancellationToken cancellationToken) => (await repository.CreateRegionAsync(user.OrganizationId!.Value, request.Request, cancellationToken)) is { } result ? ScopeResult.Authorized(result) : ScopeResult.NotFound<RegionAdminDto>();
}
public sealed class UpdateRegionCommandHandler(IAdministrationRepository repository, ICurrentUser user) : ICommandHandler<UpdateRegionCommand, ScopeResult<RegionAdminDto>>
{
    public async Task<ScopeResult<RegionAdminDto>> Handle(UpdateRegionCommand request, CancellationToken cancellationToken) => (await repository.UpdateRegionAsync(user.OrganizationId!.Value, request.RegionId, request.Request, cancellationToken)) is { } result ? ScopeResult.Authorized(result) : ScopeResult.NotFound<RegionAdminDto>();
}
public sealed class SetRegionActiveCommandHandler(IAdministrationRepository repository, ICurrentUser user) : ICommandHandler<SetRegionActiveCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(SetRegionActiveCommand request, CancellationToken cancellationToken) => ScopeResult.Authorized(await repository.SetRegionActiveAsync(user.OrganizationId!.Value, request.RegionId, request.IsActive, cancellationToken));
}
public sealed class AssignUserRoleCommandHandler(IAdministrationRepository repository, ICurrentUser user) : ICommandHandler<AssignUserRoleCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(AssignUserRoleCommand request, CancellationToken cancellationToken) => ScopeResult.Authorized(await repository.AssignUserRoleAsync(user.OrganizationId!.Value, user.UserId!.Value, request.UserId, request.RoleId, cancellationToken));
}
public sealed class RevokeUserSessionsCommandHandler(IAdministrationRepository repository, ICurrentUser user) : ICommandHandler<RevokeUserSessionsCommand, ScopeResult<int>>
{
    public async Task<ScopeResult<int>> Handle(RevokeUserSessionsCommand request, CancellationToken cancellationToken) => ScopeResult.Authorized(await repository.RevokeUserSessionsAsync(user.OrganizationId!.Value, request.UserId, cancellationToken));
}
