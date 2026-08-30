using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Pipeline.Commands;
using WaterOperations.Application.Features.Pipeline.DTOs;
using WaterOperations.Application.Features.Pipeline.Interfaces;

namespace WaterOperations.UnitTests;

public sealed class PipelineCommandTests
{
    private readonly FakePipelineRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task PublishCleanBatchCommandHandler_CallsRepositoryAndReturnsAuthorizedResult()
    {
        var handler = new PublishCleanBatchCommandHandler(repository, user);
        var batchId = Guid.NewGuid();
        var request = new CleanBatchRequestDto("v1", []);

        var result = await handler.Handle(new PublishCleanBatchCommand(batchId, request), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.IsValid);
        Assert.NotNull(result.Value);
        Assert.Equal(batchId, result.Value.BatchId);
        Assert.Equal("v1", result.Value.RulesetVersion);
    }

    private sealed class FakePipelineRepository : IPipelineRepository
    {
        public Task<CleanBatchResult?> PublishCleanAsync(
            Guid organizationId, Guid batchId, CleanBatchRequestDto request, CancellationToken cancellationToken) =>
            Task.FromResult<CleanBatchResult?>(new CleanBatchResult(batchId, 100, 0, "v1"));
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "pipeline@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["ADMIN"];
    }
}
