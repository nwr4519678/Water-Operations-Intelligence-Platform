namespace WaterOperations.Infrastructure.ProductCapabilities.AI;

public sealed class AiModelClientOptions
{
    public const string SectionName = "AiModelClient";
    public string BaseUrl { get; set; } = "http://localhost:8000";
    public string? ApiKey { get; set; }
    public int TimeoutSeconds { get; set; } = 15;
    public int MaxConcurrentRequests { get; set; } = 32;
    public int CircuitFailureThreshold { get; set; } = 5;
    public int CircuitBreakSeconds { get; set; } = 30;
}
