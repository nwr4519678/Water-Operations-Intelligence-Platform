using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

#pragma warning disable CA1725

namespace WaterOperations.Infrastructure.ProductCapabilities;

public sealed class EfProductCapabilityRepository(WaterOperationsDbContext db) : IProductCapabilityRepository
{
    public Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(Guid organizationId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.AnomalyEvents.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderByDescending(x => x.DetectedAtUtc)
            .Select(x => new AnomalyDto(x.AnomalyEventId, x.StationId, x.ReasonCode, x.Score, x.DetectedAtUtc, x.IsReviewed)), p, ct);

    public Task<PagedResult<ModelDto>> GetModelsAsync(Guid organizationId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.MlModels.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ModelDto(x.ModelId, x.ModelType, x.Version, x.Status, x.PromotedAtUtc)), p, ct);

    public Task<PagedResult<ReportDto>> GetReportsAsync(Guid organizationId, Guid userId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.Reports.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.RequestedByUserId == userId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ReportDto(x.ReportId, x.StationId, x.Format, x.Status, x.PeriodStartUtc, x.PeriodEndUtc, x.CreatedAtUtc, x.FilePath)), p, ct);

    public Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid organizationId, Guid userId, bool unreadOnly, PaginationRequest p, CancellationToken ct)
    {
        var query = db.Notifications.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.UserId == userId);
        if (unreadOnly) query = query.Where(x => x.ReadAtUtc == null);
        return PageAsync(query.OrderByDescending(x => x.CreatedAtUtc).Select(x => new NotificationDto(x.NotificationId, x.Title, x.Body, x.Severity, x.Channel, x.ReadAtUtc != null, x.CreatedAtUtc)), p, ct);
    }

    public Task<int> GetUnreadNotificationCountAsync(Guid organizationId, Guid userId, CancellationToken ct) =>
        db.Notifications.CountAsync(x => x.OrganizationId == organizationId && x.UserId == userId && x.ReadAtUtc == null, ct);

    public async Task<bool> MarkNotificationReadAsync(Guid organizationId, Guid userId, long notificationId, CancellationToken ct)
    {
        var notification = await db.Notifications.SingleOrDefaultAsync(x => x.NotificationId == notificationId && x.OrganizationId == organizationId && x.UserId == userId, ct);
        if (notification is null) return false;
        notification.ReadAtUtc ??= DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task<PagedResult<AuditEntryDto>> GetAuditAsync(Guid organizationId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.AuditLogs.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderByDescending(x => x.OccurredAtUtc)
            .Select(x => new AuditEntryDto(x.AuditLogId, x.ActionCode, x.EntityType, x.EntityId, x.Success, x.OccurredAtUtc, x.ActorUserId)), p, ct);

    public Task<PagedResult<UserAdminDto>> GetUsersAsync(Guid organizationId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId).OrderBy(x => x.DisplayName)
            .Select(x => new UserAdminDto(x.UserId, x.Email, x.DisplayName, x.ClientType, x.IsActive, x.CreatedAtUtc)), p, ct);

    public Task<OrganizationDto?> GetOrganizationAsync(Guid organizationId, CancellationToken ct) =>
        db.Organizations.AsNoTracking().Where(x => x.OrganizationId == organizationId)
            .Select(x => new OrganizationDto(x.OrganizationId, x.Name, x.Slug, x.LogoUrl, x.DefaultLocale, x.DefaultTimeZone, x.IsActive)).SingleOrDefaultAsync(ct);

    public async Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(Guid userId, CancellationToken ct) =>
        await db.DashboardLayouts.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.IsDefault).ThenBy(x => x.LayoutName)
            .Select(x => new DashboardLayoutDto(x.DashboardLayoutId, x.LayoutName, x.WidgetsJson, x.IsDefault, x.UpdatedAtUtc)).ToListAsync(ct);

    public async Task<bool> SaveLayoutAsync(Guid userId, string name, string widgetsJson, bool isDefault, CancellationToken ct)
    {
        if (isDefault) await db.DashboardLayouts.Where(x => x.UserId == userId).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsDefault, false), ct);
        var layout = await db.DashboardLayouts.SingleOrDefaultAsync(x => x.UserId == userId && x.LayoutName == name, ct);
        if (layout is null) db.DashboardLayouts.Add(new DashboardLayout { UserId = userId, LayoutName = name, WidgetsJson = widgetsJson, IsDefault = isDefault, UpdatedAtUtc = DateTime.UtcNow });
        else { layout.WidgetsJson = widgetsJson; layout.IsDefault = isDefault; layout.UpdatedAtUtc = DateTime.UtcNow; }
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task<PagedResult<SearchResultDto>> SearchAsync(Guid organizationId, string query, PaginationRequest p, CancellationToken ct)
    {
        var pattern = query.Trim();
        var stations = db.Stations.AsNoTracking().Where(x => x.OrganizationId == organizationId && (EF.Functions.ILike(x.Name, $"%{pattern}%") || EF.Functions.ILike(x.StationCode, $"%{pattern}%")))
            .Select(x => new SearchResultDto("station", x.StationId.ToString(), x.Name, x.StationCode));
        var alarms = db.Alarms.AsNoTracking().Where(x => x.OrganizationId == organizationId && EF.Functions.ILike(x.Message, $"%{pattern}%"))
            .Select(x => new SearchResultDto("alarm", x.AlarmId.ToString(), x.Message, x.Severity));
        return PageAsync(stations.Concat(alarms).OrderBy(x => x.Title), p, ct);
    }

    public Task<PagedResult<CollaborationNoteDto>> GetNotesAsync(Guid organizationId, Guid stationId, PaginationRequest p, CancellationToken ct) =>
        PageAsync(db.StationCollaborationNotes.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.StationId == stationId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new CollaborationNoteDto(x.NoteId, x.StationId, x.AuthorUserId, x.NoteText, x.IsResolved, x.CreatedAtUtc, x.UpdatedAtUtc)), p, ct);

    public async Task<CollaborationNoteDto> AddNoteAsync(Guid organizationId, Guid userId, Guid stationId, string noteText, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var note = new StationCollaborationNote { OrganizationId = organizationId, AuthorUserId = userId, StationId = stationId, NoteText = noteText, CreatedAtUtc = now, UpdatedAtUtc = now };
        db.StationCollaborationNotes.Add(note);
        await db.SaveChangesAsync(ct);
        return new CollaborationNoteDto(note.NoteId, note.StationId, note.AuthorUserId, note.NoteText, note.IsResolved, note.CreatedAtUtc, note.UpdatedAtUtc);
    }

    public async Task<SharedSnapshotDto> CreateSnapshotAsync(Guid organizationId, Guid userId, Guid? stationId, string snapshotJson, int expiresInHours, CancellationToken ct)
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        var now = DateTime.UtcNow;
        var snapshot = new ShareSnapshot { OrganizationId = organizationId, CreatedByUserId = userId, StationId = stationId, SnapshotJson = snapshotJson, TokenHash = hash, CreatedAtUtc = now, ExpiresAtUtc = now.AddHours(expiresInHours) };
        db.ShareSnapshots.Add(snapshot);
        await db.SaveChangesAsync(ct);
        return new SharedSnapshotDto(snapshot.ShareSnapshotId, stationId, snapshot.ExpiresAtUtc, now);
    }

    public async Task<ReportScheduleDto> CreateReportScheduleAsync(Guid organizationId, Guid userId, string frequency, string format, string recipientJson, DateTime nextRunAtUtc, CancellationToken ct)
    {
        var schedule = new ReportSchedule { OrganizationId = organizationId, CreatedByUserId = userId, Frequency = frequency, Format = format, RecipientJson = recipientJson, NextRunAtUtc = DateTime.SpecifyKind(nextRunAtUtc, DateTimeKind.Utc), IsActive = true };
        db.ReportSchedules.Add(schedule);
        await db.SaveChangesAsync(ct);
        return new ReportScheduleDto(schedule.ReportScheduleId, schedule.Frequency, schedule.Format, schedule.RecipientJson, schedule.NextRunAtUtc, schedule.LastRunAtUtc, schedule.IsActive);
    }

    public async Task<bool> UpdateOrganizationAsync(Guid organizationId, string name, string? logoUrl, string locale, string timeZone, CancellationToken ct)
    {
        var organization = await db.Organizations.SingleOrDefaultAsync(x => x.OrganizationId == organizationId, ct);
        if (organization is null) return false;
        organization.Name = name; organization.LogoUrl = logoUrl; organization.DefaultLocale = locale; organization.DefaultTimeZone = timeZone; organization.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken ct)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, ct);
        if (user is null) return false;
        user.IsActive = isActive; user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken ct) =>
        db.Users.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.UserId == userId)
            .Select(x => new UserPreferencesDto(x.Theme, x.PreferredLocale, x.PreferredTimeZone, x.DecimalPrecision)).SingleOrDefaultAsync(ct);

    public async Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken ct)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.UserId == userId, ct);
        if (user is null) return false;
        user.Theme = theme; user.PreferredLocale = locale; user.PreferredTimeZone = timeZone; user.DecimalPrecision = decimalPrecision; user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<NotificationPreferenceDto>> GetNotificationPreferencesAsync(Guid userId, CancellationToken ct) =>
        await db.NotificationPreferences.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.Severity)
            .Select(x => new NotificationPreferenceDto(x.Severity, x.InAppEnabled, x.EmailEnabled, x.PushEnabled, x.DesktopEnabled, x.DailyDigestEnabled)).ToListAsync(ct);

    public async Task<bool> SaveNotificationPreferenceAsync(Guid userId, NotificationPreferenceDto preference, CancellationToken ct)
    {
        var entity = await db.NotificationPreferences.SingleOrDefaultAsync(x => x.UserId == userId && x.Severity == preference.Severity, ct);
        if (entity is null)
        {
            db.NotificationPreferences.Add(new NotificationPreference { UserId = userId, Severity = preference.Severity, InAppEnabled = preference.InAppEnabled, EmailEnabled = preference.EmailEnabled, PushEnabled = preference.PushEnabled, DesktopEnabled = preference.DesktopEnabled, DailyDigestEnabled = preference.DailyDigestEnabled });
        }
        else
        {
            entity.InAppEnabled = preference.InAppEnabled; entity.EmailEnabled = preference.EmailEnabled; entity.PushEnabled = preference.PushEnabled; entity.DesktopEnabled = preference.DesktopEnabled; entity.DailyDigestEnabled = preference.DailyDigestEnabled;
        }
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, PaginationRequest request, CancellationToken ct)
    {
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 100);
        var total = await query.CountAsync(ct);
        var data = await query.Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new PagedResult<T>(data, page, size, total);
    }
}

#pragma warning restore CA1725
