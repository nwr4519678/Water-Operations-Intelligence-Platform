using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Exceptions;
using WaterOperations.Application.Common.Results;

namespace WaterOperations.Application.Features.AI.Queries;

public sealed record BulkImportConflictDto(
    Guid StationId,
    int ParameterId,
    DateTime StartTimestampUtc,
    DateTime EndTimestampUtc,
    int ExistingRowCount,
    int ImportedRowCount);

public sealed record GetBulkImportConflictsQuery(Guid BatchId)
    : IQuery<ScopeResult<IReadOnlyList<BulkImportConflictDto>>>, IRequireOrganization;

public sealed class GetBulkImportConflictsQueryHandler
    : IQueryHandler<GetBulkImportConflictsQuery, ScopeResult<IReadOnlyList<BulkImportConflictDto>>>
{
    public async Task<ScopeResult<IReadOnlyList<BulkImportConflictDto>>> Handle(GetBulkImportConflictsQuery request, CancellationToken cancellationToken)
    {
        // Mock conflict detection array for batch
        var conflicts = new List<BulkImportConflictDto>();
        return ScopeResult.Authorized<IReadOnlyList<BulkImportConflictDto>>(conflicts);
    }
}
