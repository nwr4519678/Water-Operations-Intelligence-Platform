using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/admin/jobs"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public sealed class JobExecutionController(WaterOperationsDbContext db, IJobExecutionStore jobs) : ControllerBase
{
    [HttpGet("{jobKey}")]
    public async Task<IActionResult> Get(string jobKey, CancellationToken cancellationToken)
    {
        var job = await db.JobExecutions.AsNoTracking().SingleOrDefaultAsync(x => x.JobKey == jobKey, cancellationToken);
        return job is null ? NotFound() : Ok(new { job.JobKey, job.JobType, job.Status, job.AttemptCount, job.StartedAtUtc, job.CompletedAtUtc, job.AvailableAtUtc, job.ExpiresAtUtc, job.LastError });
    }

    [HttpPost("{jobKey}/cancel")]
    public async Task<IActionResult> Cancel(string jobKey, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await jobs.CancelAsync(jobKey, string.IsNullOrWhiteSpace(request.Reason) ? "cancelled_by_admin" : request.Reason, cancellationToken);
        return NoContent();
    }

    public sealed record CancelRequest(string? Reason);
}
