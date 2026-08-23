using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Retention.DTOs;
using WaterOperations.Application.Features.Retention.Interfaces;

namespace WaterOperations.Application.Features.Retention.Commands;

public sealed record DryRunRetentionCommand(int OlderThanDays)
    : ICommand<ScopeResult<RetentionDryRun>>, IRequireOrganization;

public sealed record ExecuteRetentionCommand(PurgeRequestDto Request)
    : ICommand<ScopeResult<RetentionResult>>, IRequireOrganization;

public sealed class DryRunRetentionCommandHandler(
    IRetentionRepository retention,
    ICurrentUser currentUser)
    : ICommandHandler<DryRunRetentionCommand, ScopeResult<RetentionDryRun>>
{
    public async Task<ScopeResult<RetentionDryRun>> Handle(
        DryRunRetentionCommand request,
        CancellationToken cancellationToken)
    {
        var result = await retention.DryRunAsync(
            currentUser.OrganizationId!.Value,
            request.OlderThanDays,
            cancellationToken);
        return ScopeResult.Authorized(result);
    }
}

public sealed class ExecuteRetentionCommandHandler(
    IRetentionRepository retention,
    ICurrentUser currentUser)
    : ICommandHandler<ExecuteRetentionCommand, ScopeResult<RetentionResult>>
{
    public async Task<ScopeResult<RetentionResult>> Handle(
        ExecuteRetentionCommand request,
        CancellationToken cancellationToken)
    {
        if (!request.Request.Approved)
        {
            return ScopeResult.Forbidden<RetentionResult>();
        }

        var result = await retention.ExecuteAsync(
            currentUser.OrganizationId!.Value,
            request.Request,
            cancellationToken);
        return ScopeResult.Authorized(result);
    }
}
