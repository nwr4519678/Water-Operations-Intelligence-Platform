using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.AI.Contracts;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.AI;

public sealed class EfAiModelRepository(WaterOperationsDbContext db) : IAiModelRepository
{
    private WaterOperationsDbContext Db { get; } = db;

    private static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, PaginationRequest request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 100);
        var total = await query.CountAsync(cancellationToken);
        var data = await query.Skip((page - 1) * size).Take(size).ToListAsync(cancellationToken);
        return new PagedResult<T>(data, page, size, total);
    }
    public Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken) =>
        PageAsync(Db.AnomalyEvents.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderByDescending(x => x.DetectedAtUtc)
            .Select(x => new AnomalyDto(x.AnomalyEventId, x.StationId, x.ReasonCode, x.Score, x.DetectedAtUtc, x.IsReviewed)), pagination, cancellationToken);

    public Task<PagedResult<ModelDto>> GetModelsAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken) =>
        PageAsync(Db.MlModels.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ModelDto(x.ModelId, x.ModelType, x.Version, x.Status, x.PromotedAtUtc)), pagination, cancellationToken);

    public async Task<ModelMutationResult> PromoteModelAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        var candidate = await Db.MlModels.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);
        if (candidate is null) return new(false, "MODEL_NOT_FOUND");
        if (!string.Equals(candidate.Status, "CANDIDATE", StringComparison.OrdinalIgnoreCase)) return new(false, "INVALID_MODEL_STATE");
        var current = await Db.MlModels.Where(x => x.OrganizationId == organizationId && x.ModelType == candidate.ModelType && x.StationId == candidate.StationId && x.ParameterId == candidate.ParameterId && x.Status == "PROMOTED").OrderByDescending(x => x.PromotedAtUtc).FirstOrDefaultAsync(cancellationToken);
        if (current is not null && ReadScore(candidate.MetricsJson) <= ReadScore(current.MetricsJson)) return new(false, "PROMOTION_GATE_FAILED");
        if (current is not null) current.Status = "RETIRED";
        candidate.Status = "PROMOTED"; candidate.PromotedAtUtc = DateTime.UtcNow;
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "AI_MODEL_PROMOTED", EntityType = "MlModel", EntityId = modelId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow, AfterJson = candidate.MetricsJson });
        await Db.SaveChangesAsync(cancellationToken);
        return new(true, null);
    }

    public async Task<ModelMutationResult> StartModelRetrainingAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        var model = await Db.MlModels.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);
        if (model is null) return new(false, "MODEL_NOT_FOUND");
        if (model.Status is "TRAINING" or "PROMOTED") return new(false, "INVALID_MODEL_STATE");
        model.Status = "TRAINING";
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "AI_MODEL_RETRAIN_REQUESTED", EntityType = "MlModel", EntityId = modelId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow });
        await Db.SaveChangesAsync(cancellationToken);
        return new(true, null);
    }

    public async Task<ModelMutationResult> RetireModelAsync(Guid organizationId, Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        var model = await Db.MlModels.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.ModelId == modelId, cancellationToken);
        if (model is null) return new(false, "MODEL_NOT_FOUND");
        if (model.Status is "RETIRED" or "TRAINING") return new(false, "INVALID_MODEL_STATE");
        model.Status = "RETIRED";
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "AI_MODEL_RETIRED", EntityType = "MlModel", EntityId = modelId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow, BeforeJson = model.MetricsJson });
        await Db.SaveChangesAsync(cancellationToken);
        return new(true, null);
    }

    private static decimal ReadScore(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return 0;
        try { using var document = JsonDocument.Parse(json); foreach (var name in new[] { "score", "accuracy", "f1" }) if (document.RootElement.TryGetProperty(name, out var value) && value.TryGetDecimal(out var score)) return score; }
        catch (JsonException) { }
        return 0;
    }
}
