using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Jobs;

public sealed class ThresholdReevaluationJob(WaterOperationsDbContext dbContext)
{
    public async Task EvaluateAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var lookback = now.AddMinutes(-15);

        var activeThresholds = await dbContext.Thresholds
            .AsNoTracking()
            .Where(x => x.IsActive
                        && x.EffectiveFromUtc <= now
                        && (x.EffectiveToUtc == null || x.EffectiveToUtc.Value >= now))
            .ToListAsync(cancellationToken);

        if (activeThresholds.Count == 0)
        {
            return;
        }

        var defaultAlarmTypeId = await dbContext.AlarmTypes
            .AsNoTracking()
            .Select(x => x.AlarmTypeId)
            .FirstOrDefaultAsync(cancellationToken);

        if (defaultAlarmTypeId == 0)
        {
            return;
        }

        foreach (var threshold in activeThresholds)
        {
            var latestClean = await dbContext.MeasurementCleans
                .AsNoTracking()
                .Where(x => x.StationId == threshold.StationId
                            && x.ParameterId == threshold.ParameterId
                            && x.TimestampUtc >= lookback)
                .OrderByDescending(x => x.TimestampUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestClean == null)
            {
                continue;
            }

            var val = latestClean.Value;
            string? severity = null;
            string? message = null;
            decimal? breachThresholdVal = null;

            if (threshold.CriticalHigh.HasValue && val >= threshold.CriticalHigh.Value)
            {
                severity = "CRITICAL";
                message = $"Parameter value {val} exceeded critical high threshold {threshold.CriticalHigh.Value}.";
                breachThresholdVal = threshold.CriticalHigh.Value;
            }
            else if (threshold.CriticalLow.HasValue && val <= threshold.CriticalLow.Value)
            {
                severity = "CRITICAL";
                message = $"Parameter value {val} dropped below critical low threshold {threshold.CriticalLow.Value}.";
                breachThresholdVal = threshold.CriticalLow.Value;
            }
            else if (threshold.WarningHigh.HasValue && val >= threshold.WarningHigh.Value)
            {
                severity = "WARNING";
                message = $"Parameter value {val} exceeded warning high threshold {threshold.WarningHigh.Value}.";
                breachThresholdVal = threshold.WarningHigh.Value;
            }
            else if (threshold.WarningLow.HasValue && val <= threshold.WarningLow.Value)
            {
                severity = "WARNING";
                message = $"Parameter value {val} dropped below warning low threshold {threshold.WarningLow.Value}.";
                breachThresholdVal = threshold.WarningLow.Value;
            }

            if (severity == null)
            {
                continue;
            }

            // Episode key check: StationId + ParameterId + AlarmTypeId
            var existingAlarm = await dbContext.Alarms
                .FirstOrDefaultAsync(x => x.OrganizationId == threshold.OrganizationId
                                          && x.StationId == threshold.StationId
                                          && x.ParameterId == threshold.ParameterId
                                          && x.AlarmTypeId == defaultAlarmTypeId
                                          && (x.Status == "ACTIVE" || x.Status == "ACKNOWLEDGED"), cancellationToken);

            if (existingAlarm != null)
            {
                // Update existing breach episode without creating duplicate open alarms
                existingAlarm.ValueAtRaise = val;
                existingAlarm.ThresholdValue = breachThresholdVal;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            else
            {
                // Create new breach episode alarm
                var newAlarm = new Alarm
                {
                    AlarmId = Guid.NewGuid(),
                    OrganizationId = threshold.OrganizationId,
                    StationId = threshold.StationId,
                    ParameterId = threshold.ParameterId,
                    AlarmTypeId = defaultAlarmTypeId,
                    Severity = severity,
                    Status = "ACTIVE",
                    Message = message!,
                    ValueAtRaise = val,
                    ThresholdValue = breachThresholdVal,
                    RaisedAtUtc = now,
                    CreatedAtUtc = now
                };

                dbContext.Alarms.Add(newAlarm);

                dbContext.OutboxMessages.Add(new OutboxMessage
                {
                    OutboxMessageId = Guid.NewGuid(),
                    OrganizationId = threshold.OrganizationId,
                    EventType = "AlarmTriggered",
                    PayloadJson = JsonSerializer.Serialize(new
                    {
                        alarmId = newAlarm.AlarmId,
                        stationId = newAlarm.StationId,
                        severity = newAlarm.Severity,
                        value = newAlarm.ValueAtRaise,
                        raisedAtUtc = newAlarm.RaisedAtUtc
                    }),
                    OccurredAtUtc = now
                });

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
