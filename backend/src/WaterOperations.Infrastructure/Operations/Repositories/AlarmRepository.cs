using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Features.Alarms.Interfaces;
using WaterOperations.Application.Features.Viewer.DTOs;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Operations.Repositories;

public sealed class AlarmRepository(
    WaterOperationsDbContext dbContext,
    IMapper mapper) : IAlarmRepository
{
    public async Task<AlarmDto?> GetByIdAsync(Guid organizationId, Guid alarmId, CancellationToken cancellationToken = default)
    {
        var alarm = await dbContext.Alarms
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AlarmId == alarmId && x.OrganizationId == organizationId, cancellationToken);

        return alarm is null ? null : mapper.Map<AlarmDto>(alarm);
    }

    public async Task<AlarmDto> AcknowledgeAsync(Guid organizationId, Guid alarmId, Guid userId, CancellationToken cancellationToken = default)
    {
        var alarm = await dbContext.Alarms
            .FirstOrDefaultAsync(x => x.AlarmId == alarmId && x.OrganizationId == organizationId, cancellationToken)
            ?? throw new NotFoundException($"Alarm '{alarmId}' not found.");

        if (alarm.Status != "ACTIVE")
        {
            throw new DomainConflictException("alarm_state_conflict", $"Cannot acknowledge alarm in status '{alarm.Status}'. Alarm must be 'ACTIVE'.");
        }

        alarm.Status = "ACKNOWLEDGED";
        alarm.AcknowledgedAtUtc = DateTime.UtcNow;
        alarm.AcknowledgedByUserId = userId;

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AlarmAcknowledge",
            EntityType = "Alarm",
            EntityId = alarmId.ToString(),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { PreviousStatus = "ACTIVE", NewStatus = "ACKNOWLEDGED" }),
            Success = true
        });

        dbContext.OutboxMessages.Add(new OutboxMessage
        {
            OutboxMessageId = Guid.NewGuid(),
            OrganizationId = organizationId,
            EventType = "AlarmAcknowledged",
            PayloadJson = JsonSerializer.Serialize(new
            {
                alarmId = alarm.AlarmId,
                stationId = alarm.StationId,
                acknowledgedByUserId = userId,
                acknowledgedAtUtc = alarm.AcknowledgedAtUtc!.Value
            }),
            OccurredAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return mapper.Map<AlarmDto>(alarm);
    }

    public async Task<AlarmDto> ResolveAsync(Guid organizationId, Guid alarmId, Guid userId, string? resolutionNote, CancellationToken cancellationToken = default)
    {
        var alarm = await dbContext.Alarms
            .FirstOrDefaultAsync(x => x.AlarmId == alarmId && x.OrganizationId == organizationId, cancellationToken)
            ?? throw new NotFoundException($"Alarm '{alarmId}' not found.");

        if (alarm.Status == "RESOLVED")
        {
            throw new DomainConflictException("alarm_state_conflict", "Alarm is already resolved.");
        }

        var previousStatus = alarm.Status;
        alarm.Status = "RESOLVED";
        alarm.ResolvedAtUtc = DateTime.UtcNow;
        alarm.ResolvedByUserId = userId;
        alarm.ResolutionNote = resolutionNote;

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AlarmResolve",
            EntityType = "Alarm",
            EntityId = alarmId.ToString(),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { PreviousStatus = previousStatus, NewStatus = "RESOLVED", Note = resolutionNote }),
            Success = true
        });

        dbContext.OutboxMessages.Add(new OutboxMessage
        {
            OutboxMessageId = Guid.NewGuid(),
            OrganizationId = organizationId,
            EventType = "AlarmResolved",
            PayloadJson = JsonSerializer.Serialize(new
            {
                alarmId = alarm.AlarmId,
                stationId = alarm.StationId,
                resolvedByUserId = userId,
                resolutionNote,
                resolvedAtUtc = alarm.ResolvedAtUtc!.Value
            }),
            OccurredAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return mapper.Map<AlarmDto>(alarm);
    }

    public async Task<AlarmDto> ReopenAsync(Guid organizationId, Guid alarmId, Guid userId, CancellationToken cancellationToken = default)
    {
        var alarm = await dbContext.Alarms
            .FirstOrDefaultAsync(x => x.AlarmId == alarmId && x.OrganizationId == organizationId, cancellationToken)
            ?? throw new NotFoundException($"Alarm '{alarmId}' not found.");

        if (alarm.Status != "RESOLVED")
        {
            throw new DomainConflictException("alarm_state_conflict", $"Cannot reopen alarm in status '{alarm.Status}'. Only 'RESOLVED' alarms can be reopened.");
        }

        alarm.Status = "ACTIVE";
        alarm.ResolvedAtUtc = null;
        alarm.ResolvedByUserId = null;
        alarm.AcknowledgedAtUtc = null;
        alarm.AcknowledgedByUserId = null;

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AlarmReopen",
            EntityType = "Alarm",
            EntityId = alarmId.ToString(),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { PreviousStatus = "RESOLVED", NewStatus = "ACTIVE" }),
            Success = true
        });

        dbContext.OutboxMessages.Add(new OutboxMessage
        {
            OutboxMessageId = Guid.NewGuid(),
            OrganizationId = organizationId,
            EventType = "AlarmReopened",
            PayloadJson = JsonSerializer.Serialize(new
            {
                alarmId = alarm.AlarmId,
                stationId = alarm.StationId,
                reopenedByUserId = userId,
                reopenedAtUtc = DateTime.UtcNow
            }),
            OccurredAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return mapper.Map<AlarmDto>(alarm);
    }

    public async Task<bool> AddLabelAsync(Guid alarmId, Guid userId, string label, decimal confidence, CancellationToken cancellationToken = default)
    {
        var alarm = await dbContext.Alarms
            .FirstOrDefaultAsync(x => x.AlarmId == alarmId, cancellationToken)
            ?? throw new NotFoundException($"Alarm '{alarmId}' not found.");

        dbContext.AlarmLabels.Add(new AlarmLabel
        {
            AlarmId = alarmId,
            Label = label,
            LabeledByUserId = userId,
            LabeledAtUtc = DateTime.UtcNow,
            Notes = $"Confidence: {confidence:F2}"
        });

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = alarm.OrganizationId,
            ActorUserId = userId,
            ActionCode = "AlarmLabel",
            EntityType = "AlarmLabel",
            EntityId = alarmId.ToString(),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { Label = label, Confidence = confidence }),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
