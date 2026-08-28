using WaterOperations.Application.Features.Viewer.DTOs;

namespace WaterOperations.Application.Features.Alarms.Interfaces;

public interface IAlarmRepository
{
    Task<AlarmDto?> GetByIdAsync(Guid organizationId, Guid alarmId, CancellationToken cancellationToken = default);
    Task<AlarmDto> AcknowledgeAsync(Guid organizationId, Guid alarmId, Guid userId, CancellationToken cancellationToken = default);
    Task<AlarmDto> ResolveAsync(Guid organizationId, Guid alarmId, Guid userId, string? resolutionNote, CancellationToken cancellationToken = default);
    Task<AlarmDto> ReopenAsync(Guid organizationId, Guid alarmId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> AddLabelAsync(Guid alarmId, Guid userId, string label, decimal confidence, CancellationToken cancellationToken = default);
}
