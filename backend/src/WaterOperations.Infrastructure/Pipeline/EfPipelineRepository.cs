using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Pipeline.DTOs;
using WaterOperations.Application.Features.Pipeline.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Pipeline;

public sealed class EfPipelineRepository(
    IRepositoryContext repository,
    IUnitOfWork unitOfWork) : IPipelineRepository
{
    public async Task<CleanBatchResult?> PublishCleanAsync(
        Guid organizationId,
        Guid batchId,
        CleanBatchRequestDto request,
        CancellationToken cancellationToken)
    {
        var raw = await repository.Query<MeasurementRaw>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.IngestionBatchId == batchId)
            .ToDictionaryAsync(x => x.MeasurementRawId, cancellationToken);
        var accepted = request.Rows
            .Where(row =>
                raw.TryGetValue(row.SourceRawId, out var source)
                && source.StationId == row.StationId
                && source.ParameterId == row.ParameterId)
            .ToList();
        repository.AddRange(
            accepted.Select(row => new MeasurementClean
            {
                OrganizationId = organizationId,
                StationId = row.StationId,
                ParameterId = row.ParameterId,
                SourceRawId = row.SourceRawId,
                TimestampUtc = row.TimestampUtc.UtcDateTime,
                Value = row.Value,
                CanonicalUnit = row.Unit,
                QualityFlag = row.QualityFlag,
                QuarantineReason = row.QuarantineReason,
                CleaningRulesetVersion = request.RulesetVersion,
                IsInterpolated = row.IsInterpolated,
                ProcessedAtUtc = DateTime.UtcNow
            }));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new CleanBatchResult(
            batchId,
            accepted.Count,
            request.Rows.Count - accepted.Count,
            request.RulesetVersion);
    }
}
