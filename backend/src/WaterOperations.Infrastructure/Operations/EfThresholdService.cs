using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Operations;

public sealed class EfThresholdService(WaterOperationsDbContext db, ITenantContext tenant) : IThresholdService
{
    public async Task<IReadOnlyList<ThresholdDto>> ListAsync(Guid stationId, int parameterId, CancellationToken cancellationToken) =>
        await db.Thresholds.AsNoTracking().Where(threshold => threshold.StationId == stationId && threshold.ParameterId == parameterId && (tenant.OrganizationId == null || threshold.OrganizationId == tenant.OrganizationId)).OrderByDescending(threshold => threshold.EffectiveFromUtc)
            .Select(threshold => new ThresholdDto(threshold.ThresholdId, threshold.StationId, threshold.ParameterId, threshold.WarningLow, threshold.WarningHigh, threshold.CriticalLow, threshold.CriticalHigh, threshold.EffectiveFromUtc, threshold.EffectiveToUtc, threshold.IsActive)).ToListAsync(cancellationToken);

    public async Task<ThresholdDto> CreateAsync(ThresholdRequest request, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId) throw new UnauthorizedAccessException("A valid organization scope is required.");
        if (request.WarningLow > request.WarningHigh || request.CriticalLow > request.CriticalHigh || (request.EffectiveToUtc is not null && request.EffectiveToUtc <= request.EffectiveFromUtc))
            throw new ArgumentException("Threshold ranges and effective dates are invalid.");
        if (request.IsActive && await db.Thresholds.AnyAsync(existing => existing.OrganizationId == organizationId && existing.StationId == request.StationId && existing.ParameterId == request.ParameterId && existing.IsActive && existing.EffectiveFromUtc < (request.EffectiveToUtc ?? DateTime.MaxValue) && (existing.EffectiveToUtc == null || existing.EffectiveToUtc > request.EffectiveFromUtc), cancellationToken))
            throw new InvalidOperationException("An active threshold overlaps the requested effective window.");
        var entity = new Threshold { OrganizationId = organizationId, StationId = request.StationId, ParameterId = request.ParameterId, WarningLow = request.WarningLow, WarningHigh = request.WarningHigh, CriticalLow = request.CriticalLow, CriticalHigh = request.CriticalHigh, EffectiveFromUtc = DateTime.SpecifyKind(request.EffectiveFromUtc, DateTimeKind.Utc), EffectiveToUtc = request.EffectiveToUtc, IsActive = request.IsActive };
        db.Thresholds.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return new ThresholdDto(entity.ThresholdId, entity.StationId, entity.ParameterId, entity.WarningLow, entity.WarningHigh, entity.CriticalLow, entity.CriticalHigh, entity.EffectiveFromUtc, entity.EffectiveToUtc, entity.IsActive);
    }
}
