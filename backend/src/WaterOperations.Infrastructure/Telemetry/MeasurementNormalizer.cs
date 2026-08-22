using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Telemetry;

public sealed class MeasurementNormalizer(IServiceScopeFactory scopeFactory, ILogger<MeasurementNormalizer> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await NormalizeBatchAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Measurement normalization cycle failed");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task NormalizeBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
        var raws = await db.MeasurementRaws.Include(x => x.StationParameter).ThenInclude(x => x.Parameter)
            .Where(x => !x.MeasurementCleans.Any())
            .OrderBy(x => x.MeasurementRawId).Take(100).ToListAsync(cancellationToken);
        if (raws.Count == 0) return;

        foreach (var raw in raws)
        {
            var stationParameter = raw.StationParameter;
            if (stationParameter is null || stationParameter.Parameter is null) continue;
            var parameter = stationParameter.Parameter;
            var quality = "VALID";
            string? quarantineReason = null;
            decimal? value = raw.RawValue;
            if (!string.Equals(raw.RawUnit, parameter.CanonicalUnit, StringComparison.OrdinalIgnoreCase))
            {
                quality = "QUARANTINED"; quarantineReason = "unit_mismatch"; value = null;
            }
            else if (value is null)
            {
                quality = "QUARANTINED"; quarantineReason = "value_missing";
            }
            else
            {
                value = value.Value * stationParameter.CalibrationScale + stationParameter.CalibrationOffset;
                if (parameter.MinimumValue is decimal minimum && value < minimum || parameter.MaximumValue is decimal maximum && value > maximum)
                { quality = "SUSPECT"; quarantineReason = "value_out_of_range"; }
            }

            var duplicate = await db.MeasurementCleans.FirstOrDefaultAsync(x => x.OrganizationId == raw.OrganizationId && x.StationId == raw.StationId && x.ParameterId == raw.ParameterId && x.TimestampUtc == raw.DeviceTimestampUtc, cancellationToken);
            if (duplicate is not null)
            {
                raw.IsDuplicate = true; raw.DuplicateOfId = duplicate.SourceRawId;
                continue;
            }
            db.MeasurementCleans.Add(new MeasurementClean
            {
                OrganizationId = raw.OrganizationId, StationId = raw.StationId, ParameterId = raw.ParameterId,
                SourceRawId = raw.MeasurementRawId, TimestampUtc = DateTime.SpecifyKind(raw.DeviceTimestampUtc, DateTimeKind.Utc),
                Value = value, CanonicalUnit = parameter.CanonicalUnit, QualityFlag = quality, QuarantineReason = quarantineReason,
                CleaningRulesetVersion = "normalizer-v1", IsInterpolated = false, IsGapBoundary = false, ProcessedAtUtc = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
