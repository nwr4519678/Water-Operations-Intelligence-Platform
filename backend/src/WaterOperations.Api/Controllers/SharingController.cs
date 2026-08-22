using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/sharing"), Authorize]
public sealed class SharingController(ISender sender) : ControllerBase
{
    [HttpPost("snapshots")]
    public async Task<IActionResult> Create([FromBody] CreateShareSnapshotCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpGet("snapshots/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string token, CancellationToken ct) => (await sender.Send(new GetSharedSnapshotQuery(token), ct)).ToActionResult(this);

    [HttpDelete("snapshots/{snapshotId:guid}")]
    public async Task<IActionResult> Revoke(Guid snapshotId, CancellationToken ct) => (await sender.Send(new RevokeShareSnapshotCommand(snapshotId), ct)).ToActionResult(this);
}
