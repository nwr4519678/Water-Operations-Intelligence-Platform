namespace WaterOperations.Application.Common.Abstractions;

public sealed record TelemetryScopeRecord(string Id, string Organization, string Region, double Value, DateTime TimestampUtc, string QualityFlag);

public interface ITelemetryReadService
{
    Task<IReadOnlyList<TelemetryScopeRecord>> GetAsync(string organization, string region, CancellationToken cancellationToken = default);
}
