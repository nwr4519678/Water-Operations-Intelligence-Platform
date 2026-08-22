namespace WaterOperations.Domain.Entities;

public sealed class DataLegalHold
{
    public Guid DataLegalHoldId { get; set; }
    public Guid OrganizationId { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
