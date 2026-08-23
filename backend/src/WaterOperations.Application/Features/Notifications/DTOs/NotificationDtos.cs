namespace WaterOperations.Application.Features.Notifications.DTOs;

/// <summary>
/// User notification item details.
/// </summary>
public sealed record NotificationDto(
    long NotificationLogId,
    string Title,
    string Body,
    string Severity,
    string Channel,
    bool IsRead,
    DateTime CreatedAtUtc);

/// <summary>
/// User notification preference settings per severity level.
/// </summary>
public sealed record NotificationPreferenceDto(
    string Severity,
    bool InAppEnabled,
    bool EmailEnabled,
    bool PushEnabled,
    bool DesktopEnabled,
    bool DailyDigestEnabled);
