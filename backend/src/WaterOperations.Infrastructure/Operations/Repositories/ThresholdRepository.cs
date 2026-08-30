using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Thresholds.DTOs;
using WaterOperations.Application.Features.Thresholds.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Operations.Repositories;

public sealed class ThresholdRepository(WaterOperationsDbContext dbContext) : IThresholdRepository
{
    public async Task<PagedResult<ThresholdDto>> SearchAsync(
        Guid organizationId,
        Guid? stationId,
        int? parameterId,
        PaginationRequest pagination,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Thresholds
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (stationId.HasValue)
        {
            query = query.Where(x => x.StationId == stationId.Value);
        }

        if (parameterId.HasValue)
        {
            query = query.Where(x => x.ParameterId == parameterId.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(x => x.EffectiveFromUtc)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new ThresholdDto(
                x.ThresholdId,
                x.StationId,
                x.ParameterId,
                x.WarningLow,
                x.WarningHigh,
                x.CriticalLow,
                x.CriticalHigh,
                x.EffectiveFromUtc,
                x.EffectiveToUtc,
                x.IsActive))
            .ToListAsync(cancellationToken);

        return new PagedResult<ThresholdDto>(rows, pagination.Page, pagination.PageSize, total);
    }

    public async Task<ThresholdDto?> GetByIdAsync(Guid organizationId, long thresholdId, CancellationToken cancellationToken = default)
    {
        var t = await dbContext.Thresholds
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.ThresholdId == thresholdId && x.OrganizationId == organizationId, cancellationToken);

        return t is null ? null : new ThresholdDto(
            t.ThresholdId, t.StationId, t.ParameterId,
            t.WarningLow, t.WarningHigh, t.CriticalLow, t.CriticalHigh,
            t.EffectiveFromUtc, t.EffectiveToUtc, t.IsActive);
    }

    public async Task<ThresholdDto> CreateAsync(Guid organizationId, Guid userId, CreateThresholdRequest request, CancellationToken cancellationToken = default)
    {
        await CheckOverlapAsync(organizationId, request.StationId, request.ParameterId, null, request.EffectiveFromUtc, request.EffectiveToUtc, cancellationToken);

        var threshold = new Threshold
        {
            OrganizationId = organizationId,
            StationId = request.StationId,
            ParameterId = request.ParameterId,
            WarningLow = request.WarningLow,
            WarningHigh = request.WarningHigh,
            CriticalLow = request.CriticalLow,
            CriticalHigh = request.CriticalHigh,
            EffectiveFromUtc = request.EffectiveFromUtc,
            EffectiveToUtc = request.EffectiveToUtc,
            IsActive = true,
            UpdatedByUserId = userId
        };

        dbContext.Thresholds.Add(threshold);

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "ThresholdCreate",
            EntityType = "Threshold",
            EntityId = threshold.ThresholdId.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(request),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ThresholdDto(
            threshold.ThresholdId, threshold.StationId, threshold.ParameterId,
            threshold.WarningLow, threshold.WarningHigh, threshold.CriticalLow, threshold.CriticalHigh,
            threshold.EffectiveFromUtc, threshold.EffectiveToUtc, threshold.IsActive);
    }

    public async Task<ThresholdDto?> UpdateAsync(Guid organizationId, Guid userId, long thresholdId, UpdateThresholdRequest request, CancellationToken cancellationToken = default)
    {
        var threshold = await dbContext.Thresholds
            .FirstOrDefaultAsync(x => x.ThresholdId == thresholdId && x.OrganizationId == organizationId, cancellationToken);

        if (threshold == null)
        {
            return null;
        }

        await CheckOverlapAsync(organizationId, threshold.StationId, threshold.ParameterId, thresholdId, request.EffectiveFromUtc, request.EffectiveToUtc, cancellationToken);

        threshold.WarningLow = request.WarningLow;
        threshold.WarningHigh = request.WarningHigh;
        threshold.CriticalLow = request.CriticalLow;
        threshold.CriticalHigh = request.CriticalHigh;
        threshold.EffectiveFromUtc = request.EffectiveFromUtc;
        threshold.EffectiveToUtc = request.EffectiveToUtc;
        threshold.UpdatedByUserId = userId;

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "ThresholdUpdate",
            EntityType = "Threshold",
            EntityId = thresholdId.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(request),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ThresholdDto(
            threshold.ThresholdId, threshold.StationId, threshold.ParameterId,
            threshold.WarningLow, threshold.WarningHigh, threshold.CriticalLow, threshold.CriticalHigh,
            threshold.EffectiveFromUtc, threshold.EffectiveToUtc, threshold.IsActive);
    }

    public async Task<bool> DeactivateAsync(Guid organizationId, Guid userId, long thresholdId, CancellationToken cancellationToken = default)
    {
        var threshold = await dbContext.Thresholds
            .FirstOrDefaultAsync(x => x.ThresholdId == thresholdId && x.OrganizationId == organizationId, cancellationToken);

        if (threshold == null)
        {
            return false;
        }

        threshold.IsActive = false;
        threshold.EffectiveToUtc = DateTime.UtcNow;
        threshold.UpdatedByUserId = userId;

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "ThresholdDeactivate",
            EntityType = "Threshold",
            EntityId = thresholdId.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { DeactivatedAt = DateTime.UtcNow }),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task CheckOverlapAsync(
        Guid organizationId,
        Guid stationId,
        int parameterId,
        long? excludeThresholdId,
        DateTime fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken)
    {
        var until = toUtc ?? DateTime.MaxValue;

        var overlapping = await dbContext.Thresholds
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId
                        && x.StationId == stationId
                        && x.ParameterId == parameterId
                        && x.IsActive
                        && (excludeThresholdId == null || x.ThresholdId != excludeThresholdId.Value))
            .AnyAsync(x => x.EffectiveFromUtc < until && (x.EffectiveToUtc == null || x.EffectiveToUtc.Value > fromUtc), cancellationToken);

        if (overlapping)
        {
            throw new DomainConflictException("threshold_overlap", "Overlapping active threshold date range exists for this station and parameter.");
        }
    }
}
