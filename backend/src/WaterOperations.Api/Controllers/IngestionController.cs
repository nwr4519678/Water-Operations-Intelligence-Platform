using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/ingestion")]
[Authorize]
public sealed class IngestionController(
    ISender sender)
    : ControllerBase
{
    [HttpPost("batches")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Ingest(
        BatchRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new IngestBatchCommand(request),
            cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("batches/{batchId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.ViewerOnly)]
    public async Task<IActionResult> GetBatch(
        Guid batchId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetBatchQuery(batchId),
            cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPost("imports/csv")]
    [Authorize(Roles = "ADMIN")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> ImportCsv(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return BadRequest(new { error = "invalid_file" });
        }

        await using var content = file.OpenReadStream();
        var result = await sender.Send(
            new ImportCsvCommand(content, file.FileName, file.Length),
            cancellationToken);
        return result.ToActionResult(this);
    }
}
