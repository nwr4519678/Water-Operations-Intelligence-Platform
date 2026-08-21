using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Operations;

public sealed class EfAlarmLifecycleService(WaterOperationsDbContext db, ITenantContext tenant) : IAlarmLifecycleService
{
    public async Task<IReadOnlyList<AlarmSummaryDto>> ListAsync(string? status, CancellationToken cancellationToken)
    {
        var query = db.Alarms.AsNoTracking().Where(alarm => tenant.OrganizationId == null || alarm.OrganizationId == tenant.OrganizationId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(alarm => alarm.Status == status);
        return await query.OrderByDescending(alarm => alarm.RaisedAtUtc).Take(500)
            .Select(alarm => new AlarmSummaryDto(alarm.AlarmId, alarm.StationId, alarm.Severity, alarm.Status, alarm.Message, alarm.RaisedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public Task<AlarmMutationResult?> AcknowledgeAsync(Guid alarmId, string? note, CancellationToken cancellationToken) => ChangeAsync(alarmId, "ACKNOWLEDGED", note, cancellationToken);
    public Task<AlarmMutationResult?> ResolveAsync(Guid alarmId, string? note, CancellationToken cancellationToken) => ChangeAsync(alarmId, "RESOLVED", note, cancellationToken);

    private async Task<AlarmMutationResult?> ChangeAsync(Guid alarmId, string targetStatus, string? note, CancellationToken cancellationToken)
    {
        Guid? userId = null; // actor identity is intentionally not inferred from scope claims
        var alarm = await db.Alarms.SingleOrDefaultAsync(candidate => candidate.AlarmId == alarmId && (tenant.OrganizationId == null || candidate.OrganizationId == tenant.OrganizationId), cancellationToken);
        if (alarm is null) return null;
        if (alarm.Status == targetStatus) return new AlarmMutationResult(alarm.AlarmId, alarm.Status, DateTime.UtcNow);
        if (alarm.Status == "RESOLVED") return null;
        alarm.Status = targetStatus;
        if (targetStatus == "ACKNOWLEDGED") { alarm.AcknowledgedAtUtc = DateTime.UtcNow; alarm.ResolutionNote = note; }
        if (targetStatus == "RESOLVED") { alarm.ResolvedAtUtc = DateTime.UtcNow; alarm.ResolutionNote = note; }
        db.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            OrganizationId = alarm.OrganizationId, ActorUserId = userId, ActionCode = $"ALARM_{targetStatus}",
            EntityType = "Alarm", EntityId = alarm.AlarmId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow,
            MetadataJson = "{}"
        });
        await db.SaveChangesAsync(cancellationToken);
        return new AlarmMutationResult(alarm.AlarmId, alarm.Status, DateTime.UtcNow);
    }
}
