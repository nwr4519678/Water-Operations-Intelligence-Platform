using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Privacy;

namespace WaterOperations.UnitTests;

public sealed class DataLifecycleServiceTests
{
    [Fact]
    public async Task PurgeIsDryRunFirstTenantScopedAndIdempotent()
    {
        var organization = Guid.NewGuid();
        var otherOrganization = Guid.NewGuid();
        await using var db = new WaterOperationsDbContext(new DbContextOptionsBuilder<WaterOperationsDbContext>().UseInMemoryDatabase($"privacy-{Guid.NewGuid():N}").Options);
        db.MeasurementCleans.AddRange(
            new MeasurementClean { MeasurementCleanId = 1, OrganizationId = organization, StationId = Guid.NewGuid(), ParameterId = 1, TimestampUtc = DateTime.UtcNow.AddYears(-2), QualityFlag = "VALID", CanonicalUnit = "m", CleaningRulesetVersion = "test" },
            new MeasurementClean { MeasurementCleanId = 2, OrganizationId = otherOrganization, StationId = Guid.NewGuid(), ParameterId = 1, TimestampUtc = DateTime.UtcNow.AddYears(-2), QualityFlag = "VALID", CanonicalUnit = "m", CleaningRulesetVersion = "test" });
        db.DataQualityLogs.Add(new DataQualityLog { DataQualityLogId = 1, OrganizationId = organization, StationId = Guid.NewGuid(), WindowStartUtc = DateTime.UtcNow.AddYears(-2).AddHours(-1), WindowEndUtc = DateTime.UtcNow.AddYears(-2), RulesetVersion = "test" });
        db.ShareSnapshots.Add(new ShareSnapshot { ShareSnapshotId = Guid.NewGuid(), OrganizationId = organization, CreatedByUserId = Guid.NewGuid(), TokenHash = "hash", SnapshotJson = "{}", CreatedAtUtc = DateTime.UtcNow.AddYears(-2), ExpiresAtUtc = DateTime.UtcNow.AddYears(-2).AddDays(1) });
        await db.SaveChangesAsync();
        var service = new DataLifecycleService(db, new TenantContext(organization));
        var cutoff = DateTime.UtcNow.AddYears(-1);

        var preview = await service.PurgeAsync(cutoff, "purge-1", true, null, CancellationToken.None);
        Assert.True(preview.DryRun);
        Assert.Equal(1, preview.CleanMeasurements);
        Assert.Equal(1, preview.DataQualityLogs);
        Assert.Equal(1, preview.ShareSnapshots);
        Assert.Equal(2, await db.MeasurementCleans.CountAsync());

        var applied = await service.PurgeAsync(cutoff, "purge-1", false, null, CancellationToken.None);
        Assert.True(applied.Applied);
        Assert.Equal(1, await db.MeasurementCleans.CountAsync());
        Assert.Empty(await db.DataQualityLogs.ToListAsync());
        Assert.Empty(await db.ShareSnapshots.ToListAsync());
        Assert.Single(await db.AuditLogs.Where(x => x.ActionCode == "DATA_PURGE").ToListAsync());

        var replay = await service.PurgeAsync(cutoff, "purge-1", false, null, CancellationToken.None);
        Assert.False(replay.Applied);
        Assert.Equal(1, await db.MeasurementCleans.CountAsync());
    }

    [Fact]
    public async Task ActiveLegalHoldProtectsItsTelemetryWindow()
    {
        var organization = Guid.NewGuid();
        var heldTimestamp = DateTime.UtcNow.AddYears(-2);
        var purgeTimestamp = DateTime.UtcNow.AddYears(-3);
        await using var db = new WaterOperationsDbContext(new DbContextOptionsBuilder<WaterOperationsDbContext>().UseInMemoryDatabase($"legal-hold-{Guid.NewGuid():N}").Options);
        db.MeasurementCleans.AddRange(
            new MeasurementClean { MeasurementCleanId = 10, OrganizationId = organization, StationId = Guid.NewGuid(), ParameterId = 1, TimestampUtc = heldTimestamp, QualityFlag = "VALID", CanonicalUnit = "m", CleaningRulesetVersion = "test" },
            new MeasurementClean { MeasurementCleanId = 11, OrganizationId = organization, StationId = Guid.NewGuid(), ParameterId = 1, TimestampUtc = purgeTimestamp, QualityFlag = "VALID", CanonicalUnit = "m", CleaningRulesetVersion = "test" });
        db.DataQualityLogs.Add(new DataQualityLog { DataQualityLogId = 10, OrganizationId = organization, StationId = Guid.NewGuid(), WindowStartUtc = heldTimestamp.AddHours(-2), WindowEndUtc = heldTimestamp, RulesetVersion = "test" });
        db.DataLegalHolds.Add(new DataLegalHold { DataLegalHoldId = Guid.NewGuid(), OrganizationId = organization, FromUtc = heldTimestamp.AddHours(-1), ToUtc = heldTimestamp.AddHours(1), Reason = "regulatory review", CreatedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync();
        var service = new DataLifecycleService(db, new TenantContext(organization));

        var result = await service.PurgeAsync(DateTime.UtcNow.AddYears(-1), "hold-purge", false, null, CancellationToken.None);

        Assert.True(result.Applied);
        Assert.NotNull(await db.MeasurementCleans.FindAsync(10L));
        Assert.Null(await db.MeasurementCleans.FindAsync(11L));
        Assert.NotNull(await db.DataQualityLogs.FindAsync(10L));
    }

    [Fact]
    public async Task LegalHoldReleaseIsTenantScopedAndAudited()
    {
        var organization = Guid.NewGuid();
        var holdId = Guid.NewGuid();
        await using var db = new WaterOperationsDbContext(new DbContextOptionsBuilder<WaterOperationsDbContext>().UseInMemoryDatabase($"legal-hold-release-{Guid.NewGuid():N}").Options);
        db.DataLegalHolds.Add(new DataLegalHold { DataLegalHoldId = holdId, OrganizationId = organization, FromUtc = DateTime.UtcNow.AddDays(-2), ToUtc = null, Reason = "review", CreatedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync();

        await new DataLifecycleService(db, new TenantContext(organization)).ReleaseLegalHoldAsync(holdId, null, CancellationToken.None);

        Assert.False((await db.DataLegalHolds.SingleAsync()).IsActive);
        Assert.Single(await db.AuditLogs.Where(x => x.ActionCode == "LEGAL_HOLD_RELEASE").ToListAsync());
    }

    private sealed class TenantContext(Guid organizationId) : ITenantContext
    {
        public Guid? OrganizationId => organizationId;
        public string? Region => null;
    }
}
