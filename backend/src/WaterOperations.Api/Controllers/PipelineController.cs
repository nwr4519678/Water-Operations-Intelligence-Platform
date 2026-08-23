using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Pipeline.Commands;
using WaterOperations.Application.Features.Pipeline.DTOs;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/ingestion")]
[Authorize(Roles = "ADMIN")]
public sealed class PipelineController(
    ISender sender)
    : ControllerBase
{
    [HttpPost("batches/{batchId:guid}/clean")]
    public async Task<IActionResult> PublishClean(
        Guid batchId,
        CleanBatchRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new PublishCleanBatchCommand(batchId, request),
            cancellationToken);
        return result.ToActionResult(this);
    }
}
