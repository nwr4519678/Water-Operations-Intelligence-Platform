using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Collaboration.DTOs;
using WaterOperations.Application.Features.Collaboration.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Collaboration.Repositories;

public sealed class CollaborationRepository(WaterOperationsDbContext db) : ICollaborationRepository
{
    public async Task<PagedResult<CollaborationNoteDto>> GetNotesAsync(
        Guid organizationId,
        Guid stationId,
        PaginationRequest pagination,
        CancellationToken cancellationToken)
    {
        var query = db.StationCollaborationNotes
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.StationId == stationId)
            .OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, pagination.Page);
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new CollaborationNoteDto(
                x.NoteId,
                x.StationId,
                x.AuthorUserId,
                x.NoteText,
                x.IsResolved,
                x.CreatedAtUtc,
                x.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<CollaborationNoteDto>(items, total, page, pageSize);
    }

    public async Task<CollaborationNoteDto> AddNoteAsync(
        Guid organizationId,
        Guid userId,
        Guid stationId,
        long? parentNoteId,
        string noteText,
        CancellationToken cancellationToken)
    {
        var note = new StationCollaborationNote
        {
            OrganizationId = organizationId,
            StationId = stationId,
            AuthorUserId = userId,
            ParentNoteId = parentNoteId,
            NoteText = noteText,
            IsResolved = false,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        db.StationCollaborationNotes.Add(note);
        await db.SaveChangesAsync(cancellationToken);

        return new CollaborationNoteDto(
            note.NoteId,
            note.StationId,
            note.AuthorUserId,
            note.NoteText,
            note.IsResolved,
            note.CreatedAtUtc,
            note.UpdatedAtUtc);
    }

    public async Task<bool> UpdateNoteAsync(
        Guid organizationId,
        Guid userId,
        long noteId,
        string noteText,
        bool isResolved,
        CancellationToken cancellationToken)
    {
        var note = await db.StationCollaborationNotes
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.NoteId == noteId, cancellationToken);

        if (note is null)
        {
            return false;
        }

        note.NoteText = noteText;
        note.IsResolved = isResolved;
        note.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SharedSnapshotDto> CreateSnapshotAsync(
        Guid organizationId,
        Guid userId,
        Guid? stationId,
        string snapshotJson,
        int expiresInHours,
        CancellationToken cancellationToken)
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "", StringComparison.Ordinal)
            .Replace("/", "", StringComparison.Ordinal)
            .TrimEnd('=');

        var snapshot = new ShareSnapshot
        {
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            StationId = stationId,
            TokenHash = token,
            SnapshotJson = snapshotJson,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(expiresInHours),
            CreatedAtUtc = DateTime.UtcNow
        };

        db.ShareSnapshots.Add(snapshot);
        await db.SaveChangesAsync(cancellationToken);

        return new SharedSnapshotDto(
            snapshot.ShareSnapshotId,
            snapshot.StationId,
            snapshot.ExpiresAtUtc,
            snapshot.CreatedAtUtc,
            snapshot.TokenHash);
    }

    public async Task<SharedSnapshotContentDto?> GetSnapshotAsync(
        string token,
        CancellationToken cancellationToken)
    {
        var snapshot = await db.ShareSnapshots
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TokenHash == token && x.ExpiresAtUtc > DateTime.UtcNow, cancellationToken);

        return snapshot is null
            ? null
            : new SharedSnapshotContentDto(
                snapshot.ShareSnapshotId,
                snapshot.StationId,
                snapshot.SnapshotJson,
                snapshot.ExpiresAtUtc,
                snapshot.CreatedAtUtc);
    }

    public async Task<bool> RevokeSnapshotAsync(
        Guid organizationId,
        Guid userId,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        var snapshot = await db.ShareSnapshots
            .FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.ShareSnapshotId == snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return false;
        }

        db.ShareSnapshots.Remove(snapshot);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
