namespace WaterOperations.Domain.Entities;

public sealed class MfaRecoveryCode
{
    public Guid MfaRecoveryCodeId { get; set; }
    public Guid UserId { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UsedAtUtc { get; set; }
    public User User { get; set; } = null!;
}
