using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Notifications.Commands;
using WaterOperations.Application.Features.Notifications.Queries;
using WaterOperations.Application.Features.Settings.Commands;
using WaterOperations.Application.Features.Settings.Queries;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize]
public sealed class SettingsController(ISender sender) : ControllerBase
{
    public sealed record UpdateProfileRequest(
        string DisplayName,
        string? Theme,
        string? Locale,
        string? TimeZone,
        byte? DecimalPrecision);

    public sealed record ChangePasswordRequest(
        string CurrentPassword,
        string NewPassword);

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(
        [FromServices] WaterOperationsDbContext db,
        [FromServices] ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var email = currentUser.Email;
        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email == email || u.UserId == currentUser.UserId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        var orgName = user.Organization?.Name ?? "Ministry of Water Resources & Irrigation (MWRI)";
        return Ok(new
        {
            userId = user.UserId,
            email = user.Email,
            displayName = user.DisplayName,
            role = currentUser.Roles.FirstOrDefault() ?? "VIEWER",
            organizationId = user.OrganizationId,
            organizationName = orgName,
            theme = user.Theme ?? "SYSTEM",
            locale = user.PreferredLocale ?? "en-US",
            timeZone = user.PreferredTimeZone ?? "Africa/Cairo",
            decimalPrecision = user.DecimalPrecision,
            isActive = user.IsActive,
            createdAtUtc = user.CreatedAtUtc,
            lastLoginAtUtc = user.LastLoginAtUtc ?? DateTime.UtcNow
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] WaterOperationsDbContext db,
        [FromServices] ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var email = currentUser.Email;
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email || u.UserId == currentUser.UserId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            user.DisplayName = request.DisplayName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.Theme))
        {
            user.Theme = request.Theme.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.Locale))
        {
            user.PreferredLocale = request.Locale.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.TimeZone))
        {
            user.PreferredTimeZone = request.TimeZone.Trim();
        }
        if (request.DecimalPrecision.HasValue)
        {
            user.DecimalPrecision = request.DecimalPrecision.Value;
        }

        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, message = "Profile updated successfully in database" });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] WaterOperationsDbContext db,
        [FromServices] ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Both current and new password are required." });
        }

        if (request.NewPassword.Length < 8)
        {
            return BadRequest(new { message = "New password must be at least 8 characters." });
        }

        var email = currentUser.Email;
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email || u.UserId == currentUser.UserId, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        var passwordHasher = new PasswordHasher<User>();
        bool passwordValid = false;

        if (!string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            try
            {
                var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
                if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    passwordValid = true;
                }
            }
            catch
            {
                // Fallthrough to direct comparison
            }

            if (!passwordValid)
            {
                var suppliedBytes = Encoding.UTF8.GetBytes(request.CurrentPassword);
                var storedBytes = Encoding.UTF8.GetBytes(user.PasswordHash);
                if (suppliedBytes.Length == storedBytes.Length && CryptographicOperations.FixedTimeEquals(suppliedBytes, storedBytes))
                {
                    passwordValid = true;
                }
            }
        }

        if (!passwordValid)
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, message = "Password updated securely in database." });
    }

    [HttpGet("dashboard-layouts")]
    public async Task<IActionResult> Layouts(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetLayoutsQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("dashboard-layouts")]
    public async Task<IActionResult> SaveLayout(
        [FromBody] SaveDashboardLayoutCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("me")]
    public async Task<IActionResult> Preferences(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUserPreferencesQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdatePreferences(
        [FromBody] UpdateUserPreferencesCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpGet("notification-preferences")]
    public async Task<IActionResult> NotificationPreferences(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNotificationPreferencesQuery(), cancellationToken);
        return result.ToActionResult(this);
    }

    [HttpPut("notification-preferences")]
    public async Task<IActionResult> SaveNotificationPreference(
        [FromBody] SaveNotificationPreferenceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToActionResult(this);
    }
}
