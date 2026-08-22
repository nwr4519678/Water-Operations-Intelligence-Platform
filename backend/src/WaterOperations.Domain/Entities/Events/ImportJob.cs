namespace WaterOperations.Domain.Entities;

public sealed class ImportJob
{
    public Guid ImportJobId { get; set; }
    public Guid OrganizationId { get; set; }
    public string RequestJson { get; set; } = string.Empty;
    public string Status { get; set; } = "QUEUED";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? LastError { get; set; }
}
