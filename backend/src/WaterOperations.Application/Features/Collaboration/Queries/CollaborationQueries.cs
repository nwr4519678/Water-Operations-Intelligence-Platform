using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Collaboration.DTOs;
using WaterOperations.Application.Features.Collaboration.Interfaces;

namespace WaterOperations.Application.Features.Collaboration.Queries;

public sealed record GetCollaborationNotesQuery(
    Guid StationId,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<CollaborationNoteDto>>>, IRequireOrganization, IRequireUser;

public sealed record GetSharedSnapshotQuery(
    string Token) : IQuery<ScopeResult<SharedSnapshotContentDto>>;

public sealed class GetCollaborationNotesQueryHandler(
    ICollaborationRepository repository,
    ICurrentUser user) : IQueryHandler<GetCollaborationNotesQuery, ScopeResult<PagedResult<CollaborationNoteDto>>>
{
    public async Task<ScopeResult<PagedResult<CollaborationNoteDto>>> Handle(
        GetCollaborationNotesQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetNotesAsync(
            user.OrganizationId!.Value,
            request.StationId,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class GetSharedSnapshotQueryHandler(
    ICollaborationRepository repository) : IQueryHandler<GetSharedSnapshotQuery, ScopeResult<SharedSnapshotContentDto>>
{
    public async Task<ScopeResult<SharedSnapshotContentDto>> Handle(
        GetSharedSnapshotQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetSnapshotAsync(
            request.Token,
            cancellationToken);

        return result is null
            ? ScopeResult.NotFound<SharedSnapshotContentDto>()
            : ScopeResult.Authorized(result);
    }
}
