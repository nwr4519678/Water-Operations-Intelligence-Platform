using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/ingestion"), Authorize]
public sealed class IngestionController(IMeasurementIngestionService ingestion) : ControllerBase
{
    [HttpPost("batches")]
    public async Task<IActionResult> Ingest(IngestionBatchRequest request, CancellationToken cancellationToken) =>
        Ok(await ingestion.IngestAsync(request, cancellationToken));
}
