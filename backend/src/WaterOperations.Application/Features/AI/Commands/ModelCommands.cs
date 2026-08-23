using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;

namespace WaterOperations.Application.Features.AI.Commands;

public sealed record PromoteModelCommand(Guid ModelId)
    : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;

public sealed record RetrainModelCommand(Guid ModelId)
    : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;

public sealed record RetireModelCommand(Guid ModelId)
    : ICommand<ScopeResult<ModelMutationResult>>, IRequireOrganization, IRequireUser;

public sealed class PromoteModelCommandValidator : AbstractValidator<PromoteModelCommand>
{
    public PromoteModelCommandValidator()
    {
        RuleFor(x => x.ModelId).NotEmpty();
    }
}

public sealed class RetrainModelCommandValidator : AbstractValidator<RetrainModelCommand>
{
    public RetrainModelCommandValidator()
    {
        RuleFor(x => x.ModelId).NotEmpty();
    }
}

public sealed class RetireModelCommandValidator : AbstractValidator<RetireModelCommand>
{
    public RetireModelCommandValidator()
    {
        RuleFor(x => x.ModelId).NotEmpty();
    }
}

public sealed class PromoteModelCommandHandler(IAiModelRepository repository, ICurrentUser user)
    : ICommandHandler<PromoteModelCommand, ScopeResult<ModelMutationResult>>
{
    public async Task<ScopeResult<ModelMutationResult>> Handle(PromoteModelCommand request, CancellationToken cancellationToken)
    {
        var result = await repository.PromoteModelAsync(user.OrganizationId!.Value, user.UserId!.Value, request.ModelId, cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

public sealed class RetrainModelCommandHandler(IAiModelRepository repository, ICurrentUser user)
    : ICommandHandler<RetrainModelCommand, ScopeResult<ModelMutationResult>>
{
    public async Task<ScopeResult<ModelMutationResult>> Handle(RetrainModelCommand request, CancellationToken cancellationToken)
    {
        var result = await repository.StartModelRetrainingAsync(user.OrganizationId!.Value, user.UserId!.Value, request.ModelId, cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

public sealed class RetireModelCommandHandler(IAiModelRepository repository, ICurrentUser user)
    : ICommandHandler<RetireModelCommand, ScopeResult<ModelMutationResult>>
{
    public async Task<ScopeResult<ModelMutationResult>> Handle(RetireModelCommand request, CancellationToken cancellationToken)
    {
        var result = await repository.RetireModelAsync(user.OrganizationId!.Value, user.UserId!.Value, request.ModelId, cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

