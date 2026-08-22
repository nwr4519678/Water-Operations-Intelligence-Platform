namespace WaterOperations.Domain.Entities;

public sealed class JobExecution
{
    public Guid JobExecutionId { get; set; }
    public string JobKey { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty;
    public string Status { get; set; } = "RUNNING";
    public int AttemptCount { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime? AvailableAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public string? LastError { get; set; }
}
