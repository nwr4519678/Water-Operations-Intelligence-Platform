using WaterOperations.Infrastructure.Telemetry;

namespace WaterOperations.UnitTests;

public sealed class ScopeTests
{
    [Fact]
    public void TelemetryStoreReturnsOnlyOrganizationAndRegionScope()
    {
        var records = new TelemetryStore().ForScope("A", "1").ToList();

        Assert.Single(records);
        Assert.All(records, record =>
        {
            Assert.Equal("A", record.Organization);
            Assert.Equal("1", record.Region);
        });
    }

    [Fact]
    public void TelemetryStoreReturnsNothingOutsideRegionOrOrganization()
    {
        Assert.Empty(new TelemetryStore().ForScope("A", "9"));
        Assert.Empty(new TelemetryStore().ForScope("B", "1"));
    }
}
