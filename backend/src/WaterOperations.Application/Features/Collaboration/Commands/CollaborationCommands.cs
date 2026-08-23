using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Collaboration.DTOs;
using WaterOperations.Application.Features.Collaboration.Interfaces;

namespace WaterOperations.Application.Features.Collaboration.Commands;

public sealed record AddCollaborationNoteCommand(
    Guid StationId,
    long? ParentNoteId,
    string NoteText) : ICommand<ScopeResult<CollaborationNoteDto>>, IRequireOrganization, IRequireUser;

public sealed record UpdateCollaborationNoteCommand(
    long NoteId,
    string NoteText,
    bool IsResolved) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed record CreateShareSnapshotCommand(
    Guid? StationId,
    string SnapshotJson,
    int ExpiresInHours = 24) : ICommand<ScopeResult<SharedSnapshotDto>>, IRequireOrganization, IRequireUser;

public sealed record RevokeShareSnapshotCommand(
    Guid SnapshotId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class AddCollaborationNoteCommandValidator : AbstractValidator<AddCollaborationNoteCommand>
{
    public AddCollaborationNoteCommandValidator()
    {
        RuleFor(x => x.StationId).NotEmpty();
        RuleFor(x => x.NoteText).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.ParentNoteId).GreaterThan(0).When(x => x.ParentNoteId.HasValue);
    }
}

public sealed class UpdateCollaborationNoteCommandValidator : AbstractValidator<UpdateCollaborationNoteCommand>
{
    public UpdateCollaborationNoteCommandValidator()
    {
        RuleFor(x => x.NoteId).GreaterThan(0);
        RuleFor(x => x.NoteText).NotEmpty().MaximumLength(2000);
    }
}

public sealed class CreateShareSnapshotCommandValidator : AbstractValidator<CreateShareSnapshotCommand>
{
    public CreateShareSnapshotCommandValidator()
    {
        RuleFor(x => x.SnapshotJson).NotEmpty().MaximumLength(1_000_000);
        RuleFor(x => x.ExpiresInHours).InclusiveBetween(1, 168);
    }
}

public sealed class RevokeShareSnapshotCommandValidator : AbstractValidator<RevokeShareSnapshotCommand>
{
    public RevokeShareSnapshotCommandValidator()
    {
        RuleFor(x => x.SnapshotId).NotEmpty();
    }
}

public sealed class AddCollaborationNoteCommandHandler(
    ICollaborationRepository repository,
    ICurrentUser user) : ICommandHandler<AddCollaborationNoteCommand, ScopeResult<CollaborationNoteDto>>
{
    public async Task<ScopeResult<CollaborationNoteDto>> Handle(
        AddCollaborationNoteCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.AddNoteAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.ParentNoteId,
            request.NoteText,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class UpdateCollaborationNoteCommandHandler(
    ICollaborationRepository repository,
    ICurrentUser user) : ICommandHandler<UpdateCollaborationNoteCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        UpdateCollaborationNoteCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.UpdateNoteAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.NoteId,
            request.NoteText,
            request.IsResolved,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}

public sealed class CreateShareSnapshotCommandHandler(
    ICollaborationRepository repository,
    ICurrentUser user) : ICommandHandler<CreateShareSnapshotCommand, ScopeResult<SharedSnapshotDto>>
{
    public async Task<ScopeResult<SharedSnapshotDto>> Handle(
        CreateShareSnapshotCommand request,
        CancellationToken cancellationToken)
    {
        var result = await repository.CreateSnapshotAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.SnapshotJson,
            request.ExpiresInHours,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class RevokeShareSnapshotCommandHandler(
    ICollaborationRepository repository,
    ICurrentUser user) : ICommandHandler<RevokeShareSnapshotCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(
        RevokeShareSnapshotCommand request,
        CancellationToken cancellationToken)
    {
        var succeeded = await repository.RevokeSnapshotAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.SnapshotId,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
