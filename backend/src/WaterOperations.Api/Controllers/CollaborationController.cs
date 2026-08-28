using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Collaboration.Commands;
using WaterOperations.Application.Features.Collaboration.DTOs;
using WaterOperations.Application.Features.Collaboration.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class CollaborationController(ISender sender) : ControllerBase
{
    [HttpGet("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> Notes(
        Guid stationId,
        [FromQuery] PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCollaborationNotesQuery(stationId, pagination), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> AddNote(
        Guid stationId,
        [FromBody] AddCollaborationNoteRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AddCollaborationNoteCommand(stationId, request.ParentNoteId, request.NoteText), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("collaboration-notes/{noteId:long}")]
    public async Task<IActionResult> UpdateNote(
        long noteId,
        [FromBody] UpdateCollaborationNoteCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command with { NoteId = noteId }, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("sharing/snapshots")]
    public async Task<IActionResult> CreateSnapshot(
        [FromBody] CreateShareSnapshotCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("sharing/snapshots/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSnapshot(
        string token,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSharedSnapshotQuery(token), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpDelete("sharing/snapshots/{snapshotId:guid}")]
    public async Task<IActionResult> RevokeSnapshot(
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RevokeShareSnapshotCommand(snapshotId), cancellationToken);
        return result.ToActionResult(this);
    }
}
