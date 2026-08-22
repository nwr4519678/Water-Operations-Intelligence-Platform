using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

#pragma warning disable CA1725

namespace WaterOperations.Application.Features.ProductCapabilities.Commands;

public sealed record PromoteModelCommand(Guid ModelId) : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;
public sealed record RetrainModelCommand(Guid ModelId) : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;
public sealed record RetireModelCommand(Guid ModelId) : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;
public sealed class PromoteModelCommandValidator : AbstractValidator<PromoteModelCommand>
{ public PromoteModelCommandValidator() => RuleFor(x => x.ModelId).NotEmpty(); }
public sealed class RetrainModelCommandValidator : AbstractValidator<RetrainModelCommand>
{ public RetrainModelCommandValidator() => RuleFor(x => x.ModelId).NotEmpty(); }
public sealed class RetireModelCommandValidator : AbstractValidator<RetireModelCommand>
{ public RetireModelCommandValidator() => RuleFor(x => x.ModelId).NotEmpty(); }
public sealed class PromoteModelCommandHandler(IAiModelRepository repository, ICurrentUser user) : ICommandHandler<PromoteModelCommand, ScopeResult<ModelMutationResult>>
{ public async Task<ScopeResult<ModelMutationResult>> Handle(PromoteModelCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.PromoteModelAsync(user.OrganizationId!.Value, user.UserId!.Value, r.ModelId, ct)); }
public sealed class RetrainModelCommandHandler(IAiModelRepository repository, ICurrentUser user) : ICommandHandler<RetrainModelCommand, ScopeResult<ModelMutationResult>>
{ public async Task<ScopeResult<ModelMutationResult>> Handle(RetrainModelCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.StartModelRetrainingAsync(user.OrganizationId!.Value, user.UserId!.Value, r.ModelId, ct)); }
public sealed class RetireModelCommandHandler(IAiModelRepository repository, ICurrentUser user) : ICommandHandler<RetireModelCommand, ScopeResult<ModelMutationResult>>
{ public async Task<ScopeResult<ModelMutationResult>> Handle(RetireModelCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.RetireModelAsync(user.OrganizationId!.Value, user.UserId!.Value, r.ModelId, ct)); }

#pragma warning restore CA1725
