namespace WaterOperations.Infrastructure.AI;

public sealed class AiModelClientOptions
{
    public const string SectionName = "AiModelClient";

    public string BaseUrl { get; set; } = "http://localhost:5000/ai";
    public string? ApiKey { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
    public int CircuitFailureThreshold { get; set; } = 5;
    public int CircuitBreakDurationSeconds { get; set; } = 30;
}
