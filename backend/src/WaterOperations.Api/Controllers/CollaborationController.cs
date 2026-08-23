using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1"), Authorize]
public sealed class CollaborationController(ISender sender) : ControllerBase
{
    [HttpGet("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> Notes(Guid stationId, [FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new GetCollaborationNotesQuery(stationId, pagination), ct)).ToActionResult(this);

    [HttpPost("stations/{stationId:guid}/collaboration-notes")]
    public async Task<IActionResult> AddNote(Guid stationId, [FromBody] AddCollaborationNoteRequest request, CancellationToken ct) => (await sender.Send(new AddCollaborationNoteCommand(stationId, request.ParentNoteId, request.NoteText), ct)).ToActionResult(this);

    [HttpPut("collaboration-notes/{noteId:long}")]
    public async Task<IActionResult> UpdateNote(long noteId, [FromBody] UpdateCollaborationNoteCommand command, CancellationToken ct) => (await sender.Send(command with { NoteId = noteId }, ct)).ToActionResult(this);
}
