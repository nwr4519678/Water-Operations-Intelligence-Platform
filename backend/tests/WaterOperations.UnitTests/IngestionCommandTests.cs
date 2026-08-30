using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Repositories;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Ingestion.Interfaces;
using WaterOperations.Application.Features.Ingestion.Validators;
using WaterOperations.Domain.Entities;

namespace WaterOperations.UnitTests;

public sealed class IngestionCommandTests
{
    private readonly FakeIngestionRepository repository = new();
    private readonly FakeUnitOfWork unitOfWork = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task IngestBatchCommandHandler_DuplicateBatch_ReturnsDuplicateResult()
    {
        var batchId = Guid.NewGuid();
        repository.ExistingBatches.Add(batchId);

        var handler = new IngestBatchCommandHandler(repository, unitOfWork, user);
        var request = new BatchRequestDto(batchId, "SCADA", "SensorA", "v1", []);

        var result = await handler.Handle(new IngestBatchCommand(request), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.IsValid);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.Duplicate);
        Assert.Equal("duplicate", result.Value.Status);
    }

    [Fact]
    public async Task IngestBatchCommandHandler_ValidBatch_FiltersInactiveStationsAndTimestamps()
    {
        var stationId = Guid.NewGuid();
        var inactiveStationId = Guid.NewGuid();
        repository.ActiveStations.Add(stationId);

        var now = DateTimeOffset.UtcNow;
        var readings = new List<ReadingDto>
        {
            new(stationId, 1, now, 42.0m, "m3/h", 1, null), // Valid
            new(inactiveStationId, 1, now, 10.0m, "m3/h", 2, null), // Inactive station
            new(stationId, 1, now.AddYears(1), 5.0m, "m3/h", 3, null), // Far future (>5 min)
            new(stationId, 1, now.AddYears(-11), 5.0m, "m3/h", 4, null) // Ancient (>10 yrs)
        };

        var handler = new IngestBatchCommandHandler(repository, unitOfWork, user);
        var request = new BatchRequestDto(null, "SCADA", "SensorA", "v1", readings);

        var result = await handler.Handle(new IngestBatchCommand(request), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.IsValid);
        Assert.NotNull(result.Value);
        Assert.False(result.Value.Duplicate);
        Assert.Equal(4, result.Value.TotalRows);
        Assert.Equal(1, result.Value.AcceptedRows);
        Assert.Equal(3, result.Value.RejectedRows);
        Assert.True(unitOfWork.Saved);
    }

    [Fact]
    public async Task GetBatchQueryHandler_ExistingBatch_ReturnsAuthorizedDetails()
    {
        var batchId = Guid.NewGuid();
        repository.Details[batchId] = new BatchDetails(
            batchId, "SCADA", "Source1", "v1",
            DateTime.UtcNow, DateTime.UtcNow, 10, 10, 0, "COMPLETED", null);

        var handler = new GetBatchQueryHandler(repository, user);
        var result = await handler.Handle(new GetBatchQuery(batchId), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal(batchId, result.Value.IngestionBatchId);
    }

    [Fact]
    public async Task GetBatchQueryHandler_NonExistentBatch_ReturnsNotFound()
    {
        var handler = new GetBatchQueryHandler(repository, user);
        var result = await handler.Handle(new GetBatchQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsAuthorized);
        Assert.True(result.IsNotFound);
        Assert.Null(result.Value);
    }

    [Fact]
    public void ImportCsvCommandValidator_InvalidFileName_FailsValidation()
    {
        var validator = new ImportCsvCommandValidator();
        var command = new ImportCsvCommand(new MemoryStream(), "file.txt", 100);

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorCode == "csv_required");
    }

    [Fact]
    public void ImportCsvCommandValidator_ExcessiveFileLength_FailsValidation()
    {
        var validator = new ImportCsvCommandValidator();
        var command = new ImportCsvCommand(new MemoryStream(), "file.csv", 30_000_000);

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorCode == "invalid_file");
    }

    private sealed class FakeIngestionRepository : IIngestionRepository
    {
        public HashSet<Guid> ExistingBatches { get; } = [];
        public HashSet<Guid> ActiveStations { get; } = [];
        public Dictionary<Guid, BatchDetails> Details { get; } = [];

        public Task<bool> ExistsAsync(Guid organizationId, Guid batchId, CancellationToken cancellationToken) =>
            Task.FromResult(ExistingBatches.Contains(batchId));

        public Task<HashSet<Guid>> GetActiveStationIdsAsync(Guid organizationId, IReadOnlyCollection<Guid> stationIds, CancellationToken cancellationToken) =>
            Task.FromResult(stationIds.Where(id => ActiveStations.Contains(id)).ToHashSet());

        public void AddBatch(IngestionBatch batch, IReadOnlyCollection<ReadingDto> acceptedReadings, DateTime occurredAtUtc) { }

        public Task<BatchDetails?> GetDetailsAsync(Guid organizationId, Guid batchId, CancellationToken cancellationToken) =>
            Task.FromResult(Details.TryGetValue(batchId, out var value) ? value : null);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public bool Saved { get; private set; }
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            Saved = true;
            return Task.FromResult(1);
        }
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "ingest@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["ADMIN"];
    }
}
