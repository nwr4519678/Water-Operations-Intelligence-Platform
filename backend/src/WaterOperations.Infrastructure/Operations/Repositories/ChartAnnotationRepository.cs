using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Features.Charts.DTOs;
using WaterOperations.Application.Features.Charts.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Operations.Repositories;

public sealed class ChartAnnotationRepository(WaterOperationsDbContext dbContext) : IChartAnnotationRepository
{
    public async Task<IReadOnlyList<ChartAnnotationDto>> GetByStationAsync(
        Guid organizationId,
        Guid stationId,
        DateTimeOffset? from,
        DateTimeOffset? until,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.ChartAnnotations
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.StationId == stationId);

        if (from.HasValue)
        {
            query = query.Where(x => x.TimestampUtc >= from.Value.UtcDateTime);
        }

        if (until.HasValue)
        {
            query = query.Where(x => x.TimestampUtc <= until.Value.UtcDateTime);
        }

        return await query
            .OrderBy(x => x.TimestampUtc)
            .Select(x => new ChartAnnotationDto(
                x.ChartAnnotationId,
                x.StationId,
                x.ParameterId,
                x.UserId,
                x.TimestampUtc,
                x.Text,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<ChartAnnotationDto> CreateAsync(
        Guid organizationId,
        Guid userId,
        Guid stationId,
        CreateChartAnnotationRequest request,
        CancellationToken cancellationToken = default)
    {
        var annotation = new ChartAnnotation
        {
            OrganizationId = organizationId,
            StationId = stationId,
            ParameterId = request.ParameterId,
            UserId = userId,
            TimestampUtc = request.TimestampUtc,
            Text = request.Text,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        dbContext.ChartAnnotations.Add(annotation);

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AnnotationCreate",
            EntityType = "ChartAnnotation",
            EntityId = annotation.ChartAnnotationId.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(request),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ChartAnnotationDto(
            annotation.ChartAnnotationId,
            annotation.StationId,
            annotation.ParameterId,
            annotation.UserId,
            annotation.TimestampUtc,
            annotation.Text,
            annotation.CreatedAtUtc);
    }

    public async Task<bool> DeleteAsync(
        Guid organizationId,
        Guid userId,
        long annotationId,
        CancellationToken cancellationToken = default)
    {
        var annotation = await dbContext.ChartAnnotations
            .FirstOrDefaultAsync(x => x.ChartAnnotationId == annotationId && x.OrganizationId == organizationId, cancellationToken);

        if (annotation == null)
        {
            return false;
        }

        dbContext.ChartAnnotations.Remove(annotation);

        dbContext.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AnnotationDelete",
            EntityType = "ChartAnnotation",
            EntityId = annotationId.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OccurredAtUtc = DateTime.UtcNow,
            AfterJson = JsonSerializer.Serialize(new { DeletedAt = DateTime.UtcNow }),
            Success = true
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
