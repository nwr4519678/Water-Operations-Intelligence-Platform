namespace WaterOperations.Domain.Entities;

public sealed class OutboxMessage
{
    public Guid OutboxMessageId { get; set; }
    public Guid? OrganizationId { get; set; }
    public DateTime OccurredAtUtc { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public int AttemptCount { get; set; }
    public DateTime AvailableAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }
    public string? LastError { get; set; }
}
