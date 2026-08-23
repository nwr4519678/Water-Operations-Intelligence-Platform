using WaterOperations.Application.Features.Retention.DTOs;

namespace WaterOperations.Application.Features.Retention.Interfaces;

public interface IRetentionRepository
{
    public Task<RetentionDryRun> DryRunAsync(
        Guid organizationId,
        int olderThanDays,
        CancellationToken cancellationToken);

    public Task<RetentionResult> ExecuteAsync(
        Guid organizationId,
        PurgeRequestDto request,
        CancellationToken cancellationToken);
}
