namespace WaterOperations.Domain.Entities;

public sealed class OutboxMessage
{
    public Guid OutboxMessageId { get; set; }
    public Guid? OrganizationId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public DateTime OccurredAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }
    public DateTime? FailedAtUtc { get; set; }
    public int AttemptCount { get; set; }
    public string LastError { get; set; } = string.Empty;
}
