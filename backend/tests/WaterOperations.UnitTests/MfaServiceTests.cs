using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.UnitTests;

public sealed class MfaServiceTests
{
    [Fact]
    public async Task RecoveryCodeActivatesMfaAndCannotBeReplayed()
    {
        var userId = Guid.NewGuid();
        await using var db = new WaterOperationsDbContext(new DbContextOptionsBuilder<WaterOperationsDbContext>().UseInMemoryDatabase($"mfa-{Guid.NewGuid():N}").Options);
        db.Users.Add(new User
        {
            UserId = userId, OrganizationId = Guid.NewGuid(), Email = "mfa@example.test", DisplayName = "MFA Test",
            PasswordHash = "pbkdf2$1$AA==$AA==", ClientType = "WEB", PreferredLocale = "en", PreferredTimeZone = "UTC",
            Theme = "light", DecimalPrecision = 2, IsActive = true, CreatedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow,
            RowVersion = [1]
        });
        await db.SaveChangesAsync();
        var service = new MfaService(db, DataProtectionProvider.Create($"mfa-tests-{Guid.NewGuid():N}"));

        var enrollment = await service.EnrollAsync(userId, CancellationToken.None);
        Assert.True(await service.VerifyAsync(userId, enrollment.RecoveryCodes[0], CancellationToken.None));
        Assert.True((await db.Users.SingleAsync(x => x.UserId == userId)).IsMfaEnabled);
        Assert.False(await service.VerifyAsync(userId, enrollment.RecoveryCodes[0], CancellationToken.None));
    }
}
