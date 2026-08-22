using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/admin/jobs"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public sealed class JobExecutionController(WaterOperationsDbContext db, IJobExecutionStore jobs, ITenantContext tenant) : ControllerBase
{
    [HttpGet("{jobKey}")]
    public async Task<IActionResult> Get(string jobKey, CancellationToken cancellationToken)
    {
        var job = await db.JobExecutions.AsNoTracking().SingleOrDefaultAsync(x => x.JobKey == jobKey, cancellationToken);
        if (job is not null) return Ok(new { job.JobKey, job.JobType, job.Status, job.AttemptCount, job.StartedAtUtc, job.CompletedAtUtc, job.AvailableAtUtc, job.ExpiresAtUtc, job.LastError });
        if (jobKey.StartsWith("import:", StringComparison.OrdinalIgnoreCase) && Guid.TryParse(jobKey[7..], out var importId))
        {
            var import = await db.ImportJobs.AsNoTracking().SingleOrDefaultAsync(x => x.ImportJobId == importId && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId), cancellationToken);
            if (import is not null) return Ok(new { JobKey = jobKey, JobType = "BULK_IMPORT", import.Status, import.ProgressPercent, AttemptCount = 0, import.CreatedAtUtc, import.StartedAtUtc, import.CompletedAtUtc, LastError = import.LastError });
        }
        return NotFound();
    }

    [HttpPost("{jobKey}/cancel")]
    public async Task<IActionResult> Cancel(string jobKey, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await jobs.CancelAsync(jobKey, string.IsNullOrWhiteSpace(request.Reason) ? "cancelled_by_admin" : request.Reason, cancellationToken);
        if (jobKey.StartsWith("import:", StringComparison.OrdinalIgnoreCase) && Guid.TryParse(jobKey[7..], out var importId))
        {
            var import = await db.ImportJobs.SingleOrDefaultAsync(x => x.ImportJobId == importId && (x.Status == "QUEUED" || x.Status == "RUNNING") && (tenant.OrganizationId == null || x.OrganizationId == tenant.OrganizationId), cancellationToken);
            if (import is not null)
            {
                import.Status = import.Status == "RUNNING" ? "CANCEL_REQUESTED" : "CANCELLED";
                import.LastError = request.Reason ?? "cancelled_by_admin";
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        return NoContent();
    }

    public sealed record CancelRequest(string? Reason);
}
