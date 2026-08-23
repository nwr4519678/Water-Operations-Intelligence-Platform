using System.Globalization;
using System.Text;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Audit.DTOs;
using WaterOperations.Application.Features.Audit.Interfaces;

namespace WaterOperations.Application.Features.Audit.Queries;

public sealed record GetAuditQuery(
    AuditFilter Filter,
    PaginationRequest Pagination) : IQuery<ScopeResult<PagedResult<AuditEntryDto>>>, IRequireOrganization, IRequireUser;

public sealed class GetAuditQueryHandler(
    IAuditRepository repository,
    ICurrentUser user) : IQueryHandler<GetAuditQuery, ScopeResult<PagedResult<AuditEntryDto>>>
{
    public async Task<ScopeResult<PagedResult<AuditEntryDto>>> Handle(
        GetAuditQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetAuditAsync(
            user.OrganizationId!.Value,
            request.Filter,
            request.Pagination,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

/// <summary>
/// Exports audit log entries as CSV for a given filter.
/// </summary>
public sealed record ExportAuditQuery(
    AuditFilter Filter) : IQuery<ScopeResult<string>>, IRequireOrganization, IRequireUser;

public sealed class ExportAuditQueryHandler(
    IAuditRepository repository,
    ICurrentUser user) : IQueryHandler<ExportAuditQuery, ScopeResult<string>>
{
    public async Task<ScopeResult<string>> Handle(
        ExportAuditQuery request,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetAuditAsync(
            user.OrganizationId!.Value,
            request.Filter,
            new PaginationRequest(1, 10_000),
            cancellationToken);

        var lines = new StringBuilder("timestamp,actorUserId,actionCode,entityType,entityId,success\n");
        foreach (var entry in result.Data)
        {
            lines.Append(CultureInfo.InvariantCulture, $"{entry.OccurredAtUtc:O},{entry.ActorUserId},{entry.ActionCode},{entry.EntityType},{entry.EntityId},{entry.Success}\n");
        }

        return ScopeResult.Authorized(lines.ToString());
    }
}
