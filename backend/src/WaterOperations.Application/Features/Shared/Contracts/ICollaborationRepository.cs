using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;

namespace WaterOperations.Application.Features.ProductCapabilities.Interfaces;

public interface ICollaborationRepository
{
    Task<PagedResult<CollaborationNoteDto>> GetNotesAsync(Guid organizationId, Guid stationId, PaginationRequest pagination, CancellationToken cancellationToken);
    Task<CollaborationNoteDto> AddNoteAsync(Guid organizationId, Guid userId, Guid stationId, long? parentNoteId, string noteText, CancellationToken cancellationToken);
    Task<bool> UpdateNoteAsync(Guid organizationId, Guid userId, long noteId, string noteText, bool isResolved, CancellationToken cancellationToken);
    Task<SharedSnapshotDto> CreateSnapshotAsync(Guid organizationId, Guid userId, Guid? stationId, string snapshotJson, int expiresInHours, CancellationToken cancellationToken);
    Task<SharedSnapshotContentDto?> GetSnapshotAsync(string token, CancellationToken cancellationToken);
    Task<bool> RevokeSnapshotAsync(Guid organizationId, Guid userId, Guid snapshotId, CancellationToken cancellationToken);
}
