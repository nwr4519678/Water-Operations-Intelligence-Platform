using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Ingestion.Interfaces;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Application.Features.Ingestion.Commands;

public sealed record IngestBatchCommand(BatchRequestDto Request)
    : ICommand<IngestionCommandResult>, IRequireOrganization;

public sealed record ImportCsvCommand(
    Stream Content,
    string FileName,
    long Length)
    : ICommand<IngestionCommandResult>, IRequireOrganization;

public sealed record IngestionCommandResult(
    bool IsAuthorized,
    bool IsValid,
    IngestionResult? Value,
    string? ErrorCode = null)
{
    public IngestionDuplicateResponse? DuplicateResponse =>
        Value is { Duplicate: true } value
            ? new IngestionDuplicateResponse(value.BatchId, value.Status)
            : null;
}

public sealed record GetBatchQuery(Guid BatchId)
    : IQuery<ScopeResult<BatchDetails>>, IRequireOrganization;

public sealed class IngestBatchCommandHandler(
    IIngestionRepository ingestion,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<IngestBatchCommand, IngestionCommandResult>
{
    public async Task<IngestionCommandResult> Handle(
        IngestBatchCommand request,
        CancellationToken cancellationToken)
    {
        var organizationId = currentUser.OrganizationId!.Value;
        var batchId = request.Request.BatchId ?? Guid.NewGuid();

        if (await ingestion.ExistsAsync(organizationId, batchId, cancellationToken))
        {
            return new IngestionCommandResult(
                IsAuthorized: true,
                IsValid: true,
                Value: new IngestionResult(batchId, "duplicate", 0, 0, 0, true));
        }

        var stationIds = request.Request.Readings
            .Select(reading => reading.StationId)
            .Distinct()
            .ToArray();

        var activeStationIds = await ingestion.GetActiveStationIdsAsync(
            organizationId,
            stationIds,
            cancellationToken);

        var now = DateTime.UtcNow;
        var nowOffset = new DateTimeOffset(now, TimeSpan.Zero);

        var accepted = request.Request.Readings
            .Where(reading =>
                activeStationIds.Contains(reading.StationId) &&
                reading.TimestampUtc <= nowOffset.AddMinutes(5) &&
                reading.TimestampUtc >= nowOffset.AddYears(-10))
            .ToArray();

        var batch = new IngestionBatch
        {
            IngestionBatchId = batchId,
            OrganizationId = organizationId,
            SourceType = request.Request.SourceType,
            SourceName = request.Request.SourceName,
            SchemaVersion = request.Request.SchemaVersion
        };

        var completion = batch.Complete(
            request.Request.Readings.Count,
            accepted.Length,
            now,
            now);

        if (!completion.IsSuccess)
        {
            return new IngestionCommandResult(true, false, null, completion.Error);
        }

        ingestion.AddBatch(batch, accepted, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new IngestionCommandResult(
            IsAuthorized: true,
            IsValid: true,
            Value: new IngestionResult(
                batchId,
                batch.Status,
                batch.TotalRows,
                batch.AcceptedRows,
                batch.RejectedRows,
                false));
    }
}

public sealed class ImportCsvCommandHandler(
    IIngestionRepository ingestion,
    IUnitOfWork unitOfWork,
    ICsvBatchParser parser,
    ICurrentUser currentUser)
    : ICommandHandler<ImportCsvCommand, IngestionCommandResult>
{
    public async Task<IngestionCommandResult> Handle(
        ImportCsvCommand request,
        CancellationToken cancellationToken)
    {
        var batch = await parser.ParseAsync(
            request.Content,
            request.FileName,
            cancellationToken);

        if (batch is null)
        {
            return new IngestionCommandResult(true, false, null, "missing_header");
        }

        // BUG-4 fix: inline ingestion logic directly instead of dispatching
        // through ISender, which would execute the entire MediatR pipeline again
        // (authorization + validation) on an already-authorized+validated request.
        var handler = new IngestBatchCommandHandler(ingestion, unitOfWork, currentUser);
        return await handler.Handle(new IngestBatchCommand(batch), cancellationToken);
    }
}

public sealed class GetBatchQueryHandler(
    IIngestionRepository ingestion,
    ICurrentUser currentUser)
    : IQueryHandler<GetBatchQuery, ScopeResult<BatchDetails>>
{
    public async Task<ScopeResult<BatchDetails>> Handle(
        GetBatchQuery request,
        CancellationToken cancellationToken)
    {
        var result = await ingestion.GetDetailsAsync(
            currentUser.OrganizationId!.Value,
            request.BatchId,
            cancellationToken);

        return result is null
            ? ScopeResult.NotFound<BatchDetails>()
            : ScopeResult.Authorized(result);
    }
}
