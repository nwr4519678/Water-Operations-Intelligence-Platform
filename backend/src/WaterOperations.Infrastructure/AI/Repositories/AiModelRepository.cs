using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.AI.DTOs;
using WaterOperations.Application.Features.AI.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.AI.Repositories;

public sealed class AiModelRepository(WaterOperationsDbContext db) : IAiModelRepository
{
    public async Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.AnomalyEvents
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderByDescending(x => x.DetectedAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AnomalyDto(
                x.AnomalyEventId,
                x.StationId,
                x.ReasonCode,
                x.Score,
                x.DetectedAtUtc,
                x.IsReviewed))
            .ToListAsync(cancellationToken);

        return new PagedResult<AnomalyDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<ModelDto>> GetModelsAsync(
        Guid organizationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.MlModels
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ModelDto(
                x.ModelId,
                x.ModelType,
                x.Version,
                x.Status,
                x.PromotedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<ModelDto>(items, total, page, pageSize);
    }

    public async Task<ModelMutationResult> PromoteModelAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await db.MlModels
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);

        if (model is null)
        {
            return new ModelMutationResult(false, "MODEL_NOT_FOUND");
        }

        model.Status = "ACTIVE";
        model.PromotedAtUtc = DateTime.UtcNow;

        db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AI_MODEL_PROMOTED",
            EntityType = "AiModel",
            EntityId = modelId.ToString(),
            Success = true,
            OccurredAtUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        return new ModelMutationResult(true, null);
    }

    public async Task<ModelMutationResult> StartModelRetrainingAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await db.MlModels
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);

        if (model is null)
        {
            return new ModelMutationResult(false, "MODEL_NOT_FOUND");
        }

        model.Status = "RETRAINING";

        db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AI_MODEL_RETRAIN_REQUESTED",
            EntityType = "AiModel",
            EntityId = modelId.ToString(),
            Success = true,
            OccurredAtUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        return new ModelMutationResult(true, null);
    }

    public async Task<ModelMutationResult> RetireModelAsync(
        Guid organizationId,
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await db.MlModels
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);

        if (model is null)
        {
            return new ModelMutationResult(false, "MODEL_NOT_FOUND");
        }

        model.Status = "RETIRED";

        db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = userId,
            ActionCode = "AI_MODEL_RETIRED",
            EntityType = "AiModel",
            EntityId = modelId.ToString(),
            Success = true,
            OccurredAtUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        return new ModelMutationResult(true, null);
    }
}
