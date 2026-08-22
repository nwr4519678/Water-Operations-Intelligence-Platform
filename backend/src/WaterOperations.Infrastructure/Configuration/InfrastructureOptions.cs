namespace WaterOperations.Infrastructure.Configuration;

public sealed class InfrastructureOptions
{
    public const string SectionName = "Infrastructure";

    public string StorageRootPath { get; set; } =
        Path.Combine(AppContext.BaseDirectory, "storage");

    public int OutboxBatchSize { get; set; } = 100;

    public int OutboxMaxAttempts { get; set; } = 10;
}
