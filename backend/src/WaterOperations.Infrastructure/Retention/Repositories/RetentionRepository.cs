using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Retention.DTOs;
using WaterOperations.Application.Features.Retention.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Retention.Repositories;

public sealed class RetentionRepository(
    IRepositoryContext repository,
    IUnitOfWork unitOfWork) : IRetentionRepository
{
    public async Task<RetentionDryRun> DryRunAsync(
        Guid organizationId,
        int olderThanDays,
        CancellationToken cancellationToken)
    {
        var days = Math.Clamp(olderThanDays, 30, 3650);
        var cutoff = DateTime.UtcNow.AddDays(-days);

        var raw = await repository.Query<MeasurementRaw>()
            .CountAsync(x => x.OrganizationId == organizationId && x.CreatedAtUtc < cutoff, cancellationToken);

        var clean = await repository.Query<MeasurementClean>()
            .CountAsync(x => x.OrganizationId == organizationId && x.TimestampUtc < cutoff, cancellationToken);

        return new RetentionDryRun(organizationId, cutoff, raw, clean, true);
    }

    public async Task<RetentionResult> ExecuteAsync(
        Guid organizationId,
        PurgeRequestDto request,
        CancellationToken cancellationToken)
    {
        var days = Math.Clamp(request.OlderThanDays, 30, 3650);
        var cutoff = DateTime.UtcNow.AddDays(-days);

        var raw = await repository.Query<MeasurementRaw>()
            .Where(x => x.OrganizationId == organizationId && x.CreatedAtUtc < cutoff)
            .ToListAsync(cancellationToken);

        var clean = await repository.Query<MeasurementClean>()
            .Where(x => x.OrganizationId == organizationId && x.TimestampUtc < cutoff)
            .ToListAsync(cancellationToken);

        repository.RemoveRange(raw);
        repository.RemoveRange(clean);

        repository.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActionCode = "RETENTION_PURGE",
            EntityType = "Organization",
            EntityId = organizationId.ToString(),
            Success = true,
            MetadataJson = JsonSerializer.Serialize(new { days, raw = raw.Count, clean = clean.Count }),
            OccurredAtUtc = DateTime.UtcNow
        });

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new RetentionResult(organizationId, raw.Count, clean.Count, cutoff);
    }
}
