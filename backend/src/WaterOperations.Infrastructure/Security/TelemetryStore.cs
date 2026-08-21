namespace WaterOperations.Infrastructure.Security;

public sealed record TelemetryRecord(string Id, string Organization, string Region, double Value);

public sealed class TelemetryStore
{
    private readonly IReadOnlyList<TelemetryRecord> records =
    [new("station-a-1", "A", "1", 42.5), new("station-a-2", "A", "2", 38.1), new("station-b-1", "B", "2", 91.7)];

    public IEnumerable<TelemetryRecord> ForScope(string organization, string region) =>
        records.Where(x => x.Organization == organization && x.Region == region);
}
