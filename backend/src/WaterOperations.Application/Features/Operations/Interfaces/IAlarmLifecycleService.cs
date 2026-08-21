using WaterOperations.Application.Features.Operations.DTOs;

namespace WaterOperations.Application.Features.Operations.Interfaces;

public interface IAlarmLifecycleService
{
    Task<IReadOnlyList<AlarmSummaryDto>> ListAsync(string? status, CancellationToken cancellationToken);
    Task<AlarmMutationResult?> AcknowledgeAsync(Guid alarmId, string? note, CancellationToken cancellationToken);
    Task<AlarmMutationResult?> ResolveAsync(Guid alarmId, string? note, CancellationToken cancellationToken);
}
