using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Privacy;

public sealed record DataPurgeResult(string IdempotencyKey, bool DryRun, int CleanMeasurements, int RawMeasurements, bool Applied);

public sealed class DataLifecycleService(WaterOperationsDbContext db, ITenantContext tenant)
{
    private const int MaxRowsPerRun = 10_000;

    public async Task<DataPurgeResult> PurgeAsync(DateTime beforeUtc, string idempotencyKey, bool dryRun, Guid? actorUserId, CancellationToken cancellationToken)
    {
        if (beforeUtc.Kind != DateTimeKind.Utc) throw new ArgumentException("beforeUtc must be UTC.", nameof(beforeUtc));
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 200) throw new ArgumentException("A bounded idempotency key is required.", nameof(idempotencyKey));
        if (tenant.OrganizationId is not Guid organizationId) throw new UnauthorizedAccessException("A valid organization scope is required.");

        if (await db.AuditLogs.AnyAsync(x => x.OrganizationId == organizationId && x.ActionCode == "DATA_PURGE" && x.EntityId == idempotencyKey, cancellationToken))
            return new DataPurgeResult(idempotencyKey, false, 0, 0, false);

        var cleanIds = await db.MeasurementCleans.Where(x => x.OrganizationId == organizationId && x.TimestampUtc < beforeUtc)
            .Where(x => !db.DataLegalHolds.Any(hold => hold.OrganizationId == organizationId && hold.IsActive && x.TimestampUtc >= hold.FromUtc && (hold.ToUtc == null || x.TimestampUtc < hold.ToUtc)))
            .OrderBy(x => x.MeasurementCleanId).Select(x => x.MeasurementCleanId).Take(MaxRowsPerRun).ToListAsync(cancellationToken);
        var rawIds = await db.MeasurementRaws.Where(x => x.OrganizationId == organizationId && x.DeviceTimestampUtc < beforeUtc)
            .Where(x => !db.DataLegalHolds.Any(hold => hold.OrganizationId == organizationId && hold.IsActive && x.DeviceTimestampUtc >= hold.FromUtc && (hold.ToUtc == null || x.DeviceTimestampUtc < hold.ToUtc)))
            .OrderBy(x => x.MeasurementRawId).Select(x => x.MeasurementRawId).Take(MaxRowsPerRun).ToListAsync(cancellationToken);
        if (dryRun) return new DataPurgeResult(idempotencyKey, true, cleanIds.Count, rawIds.Count, false);

        var cleanRows = await db.MeasurementCleans.Where(x => cleanIds.Contains(x.MeasurementCleanId)).ToListAsync(cancellationToken);
        var rawRows = await db.MeasurementRaws.Where(x => rawIds.Contains(x.MeasurementRawId)).ToListAsync(cancellationToken);
        db.MeasurementCleans.RemoveRange(cleanRows);
        db.MeasurementRaws.RemoveRange(rawRows);
        db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId, ActorUserId = actorUserId, ActionCode = "DATA_PURGE",
            EntityType = "TelemetryRetention", EntityId = idempotencyKey, Success = true,
            OccurredAtUtc = DateTime.UtcNow, MetadataJson = JsonSerializer.Serialize(new { beforeUtc, cleanMeasurements = cleanRows.Count, rawMeasurements = rawRows.Count })
        });
        await db.SaveChangesAsync(cancellationToken);
        return new DataPurgeResult(idempotencyKey, false, cleanRows.Count, rawRows.Count, true);
    }

    public async Task<Guid> CreateLegalHoldAsync(DateTime fromUtc, DateTime? toUtc, string reason, Guid? actorUserId, CancellationToken cancellationToken)
    {
        if (fromUtc.Kind != DateTimeKind.Utc || (toUtc is not null && toUtc.Value.Kind != DateTimeKind.Utc) || (toUtc is not null && toUtc <= fromUtc)) throw new ArgumentException("Legal hold dates must be UTC and ordered.");
        if (tenant.OrganizationId is not Guid organizationId) throw new UnauthorizedAccessException("A valid organization scope is required.");
        var hold = new DataLegalHold { DataLegalHoldId = Guid.NewGuid(), OrganizationId = organizationId, FromUtc = fromUtc, ToUtc = toUtc, Reason = reason, CreatedAtUtc = DateTime.UtcNow, CreatedByUserId = actorUserId };
        db.DataLegalHolds.Add(hold);
        await db.SaveChangesAsync(cancellationToken);
        return hold.DataLegalHoldId;
    }
}
