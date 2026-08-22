using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.ProductCapabilities.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Collaboration;

public sealed class EfCollaborationRepository(WaterOperationsDbContext db) : EfProductCapabilityRepositoryBase(db), ICollaborationRepository
{
    public Task<PagedResult<CollaborationNoteDto>> GetNotesAsync(Guid organizationId, Guid stationId, PaginationRequest pagination, CancellationToken cancellationToken) => PageAsync(Db.StationCollaborationNotes.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.StationId == stationId).OrderByDescending(x => x.CreatedAtUtc).Select(x => new CollaborationNoteDto(x.NoteId, x.StationId, x.AuthorUserId, x.NoteText, x.IsResolved, x.CreatedAtUtc, x.UpdatedAtUtc)), pagination, cancellationToken);

    public async Task<CollaborationNoteDto> AddNoteAsync(Guid organizationId, Guid userId, Guid stationId, long? parentNoteId, string noteText, CancellationToken cancellationToken)
    {
        if (parentNoteId is not null && !await Db.StationCollaborationNotes.AnyAsync(x => x.NoteId == parentNoteId.Value && x.OrganizationId == organizationId && x.StationId == stationId, cancellationToken)) throw new InvalidOperationException("Parent collaboration note does not belong to the station.");
        var now = DateTime.UtcNow;
        var note = new StationCollaborationNote { OrganizationId = organizationId, AuthorUserId = userId, StationId = stationId, ParentNoteId = parentNoteId, NoteText = noteText, CreatedAtUtc = now, UpdatedAtUtc = now };
        Db.StationCollaborationNotes.Add(note);
        await Db.SaveChangesAsync(cancellationToken);
        return new CollaborationNoteDto(note.NoteId, note.StationId, note.AuthorUserId, note.NoteText, note.IsResolved, note.CreatedAtUtc, note.UpdatedAtUtc);
    }

    public async Task<bool> UpdateNoteAsync(Guid organizationId, Guid userId, long noteId, string noteText, bool isResolved, CancellationToken cancellationToken)
    {
        var note = await Db.StationCollaborationNotes.SingleOrDefaultAsync(x => x.NoteId == noteId && x.OrganizationId == organizationId && x.AuthorUserId == userId, cancellationToken);
        if (note is null) return false;
        var before = JsonSerializer.Serialize(new { note.NoteText, note.IsResolved });
        note.NoteText = noteText; note.IsResolved = isResolved; note.UpdatedAtUtc = DateTime.UtcNow;
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "COLLABORATION_NOTE_UPDATED", EntityType = "StationCollaborationNote", EntityId = noteId.ToString(System.Globalization.CultureInfo.InvariantCulture), Success = true, OccurredAtUtc = DateTime.UtcNow, BeforeJson = before, AfterJson = JsonSerializer.Serialize(new { note.NoteText, note.IsResolved }) });
        await Db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SharedSnapshotDto> CreateSnapshotAsync(Guid organizationId, Guid userId, Guid? stationId, string snapshotJson, int expiresInHours, CancellationToken cancellationToken)
    {
        if (stationId is not null && !await Db.Stations.AnyAsync(x => x.OrganizationId == organizationId && x.StationId == stationId.Value, cancellationToken)) throw new InvalidOperationException("Station is outside the organization.");
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        var now = DateTime.UtcNow;
        var snapshot = new ShareSnapshot { OrganizationId = organizationId, CreatedByUserId = userId, StationId = stationId, SnapshotJson = snapshotJson, TokenHash = hash, CreatedAtUtc = now, ExpiresAtUtc = now.AddHours(expiresInHours) };
        Db.ShareSnapshots.Add(snapshot);
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "SHARED_SNAPSHOT_CREATED", EntityType = "ShareSnapshot", EntityId = snapshot.ShareSnapshotId.ToString(), Success = true, OccurredAtUtc = now });
        await Db.SaveChangesAsync(cancellationToken);
        return new SharedSnapshotDto(snapshot.ShareSnapshotId, stationId, snapshot.ExpiresAtUtc, now, token);
    }

    public async Task<SharedSnapshotContentDto?> GetSnapshotAsync(string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        var snapshot = await Db.ShareSnapshots.AsNoTracking().SingleOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > DateTime.UtcNow, cancellationToken);
        return snapshot is null ? null : new SharedSnapshotContentDto(snapshot.ShareSnapshotId, snapshot.StationId, snapshot.SnapshotJson, snapshot.ExpiresAtUtc, snapshot.CreatedAtUtc);
    }

    public async Task<bool> RevokeSnapshotAsync(Guid organizationId, Guid userId, Guid snapshotId, CancellationToken cancellationToken)
    {
        var snapshot = await Db.ShareSnapshots.SingleOrDefaultAsync(x => x.ShareSnapshotId == snapshotId && x.OrganizationId == organizationId && x.CreatedByUserId == userId, cancellationToken);
        if (snapshot is null || snapshot.RevokedAtUtc is not null) return false;
        snapshot.RevokedAtUtc = DateTime.UtcNow;
        Db.AuditLogs.Add(new AuditLog { OrganizationId = organizationId, ActorUserId = userId, ActionCode = "SHARED_SNAPSHOT_REVOKED", EntityType = "ShareSnapshot", EntityId = snapshotId.ToString(), Success = true, OccurredAtUtc = DateTime.UtcNow });
        await Db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
