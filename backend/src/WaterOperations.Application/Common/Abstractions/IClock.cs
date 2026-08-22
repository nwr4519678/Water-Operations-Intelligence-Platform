namespace WaterOperations.Application.Common.Abstractions;

public interface IClock
{
    public DateTime UtcNow { get; }

    public DateTimeOffset UtcNowOffset { get; }
}
