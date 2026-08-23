using System.Text;
using WaterOperations.Infrastructure.Ingestion;

namespace WaterOperations.UnitTests;

public sealed class CsvBatchParserTests
{
    private readonly CsvBatchParser parser = new();

    [Fact]
    public async Task ParseAsync_EmptyStream_ReturnsNull()
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(string.Empty));

        var result = await parser.ParseAsync(stream, "empty.csv", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task ParseAsync_HeaderOnly_ReturnsBatchWithNoReadings()
    {
        var csv = "StationId,ParameterId,Timestamp,Value,Unit\n";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        var result = await parser.ParseAsync(stream, "header_only.csv", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result.Readings);
        Assert.Equal("header_only.csv", result.SourceName);
    }

    [Fact]
    public async Task ParseAsync_ValidRows_ParsesCorrectly()
    {
        var stationId = Guid.NewGuid();
        var csv = $"StationId,ParameterId,Timestamp,Value,Unit\n{stationId},1,2026-08-23T12:00:00Z,42.5,m3/h,100\n";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        var result = await parser.ParseAsync(stream, "data.csv", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Readings);

        var row = result.Readings[0];
        Assert.Equal(stationId, row.StationId);
        Assert.Equal(1, row.ParameterId);
        Assert.Equal(42.5m, row.Value);
        Assert.Equal("m3/h", row.Unit);
        Assert.Equal(100L, row.DeviceSequence);
    }

    [Fact]
    public async Task ParseAsync_MalformedRows_SkippedSilently()
    {
        var stationId = Guid.NewGuid();
        var csv = $"StationId,ParameterId,Timestamp,Value,Unit\n" +
                  $"invalid-guid,1,2026-08-23T12:00:00Z,42.5,m3/h\n" + // bad GUID
                  $"{stationId},not-a-number,2026-08-23T12:00:00Z,42.5,m3/h\n" + // bad param ID
                  $"{stationId},1,2026-08-23T12:00:00Z,42.5,m3/h\n"; // valid row

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        var result = await parser.ParseAsync(stream, "malformed.csv", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Readings);
        Assert.Equal(stationId, result.Readings[0].StationId);
    }

    [Fact]
    public async Task ParseAsync_HandlesUtf8Bom()
    {
        var stationId = Guid.NewGuid();
        var csv = $"StationId,ParameterId,Timestamp,Value,Unit\n{stationId},1,2026-08-23T12:00:00Z,10.0,L/s\n";
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        using var stream = new MemoryStream(bytes);

        var result = await parser.ParseAsync(stream, "bom.csv", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Readings);
        Assert.Equal(10.0m, result.Readings[0].Value);
    }
}
