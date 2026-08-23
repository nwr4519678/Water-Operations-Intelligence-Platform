using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Pipeline.DTOs;
using WaterOperations.Application.Features.Pipeline.Interfaces;

namespace WaterOperations.Application.Features.Pipeline.Commands;

public sealed record PublishCleanBatchCommand(
    Guid BatchId,
    CleanBatchRequestDto Request)
    : ICommand<PipelineCommandResult>, IRequireOrganization;

public sealed record PipelineCommandResult(
    bool IsAuthorized,
    bool IsValid,
    CleanBatchResult? Value);

public sealed class PublishCleanBatchCommandHandler(
    IPipelineRepository pipeline,
    ICurrentUser currentUser)
    : ICommandHandler<PublishCleanBatchCommand, PipelineCommandResult>
{
    public async Task<PipelineCommandResult> Handle(
        PublishCleanBatchCommand request,
        CancellationToken cancellationToken)
    {
        var result = await pipeline.PublishCleanAsync(
            currentUser.OrganizationId!.Value,
            request.BatchId,
            request.Request,
            cancellationToken);
        return new(true, true, result);
    }
}
