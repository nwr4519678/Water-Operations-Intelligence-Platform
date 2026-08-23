using System.Text.Json;
using WaterOperations.Infrastructure.Messaging;

namespace WaterOperations.UnitTests;

public sealed class OutboxPayloadSerializerTests
{
    private sealed record SamplePayload(Guid Id, string EventName, DateTime CreatedAtUtc);

    [Fact]
    public void SerializeAndDeserialize_RoundtripsCorrectly()
    {
        var original = new SamplePayload(Guid.NewGuid(), "TELEMETRY_INGESTED", DateTime.UtcNow);

        var json = OutboxPayloadSerializer.Serialize(original);
        var deserialized = OutboxPayloadSerializer.Deserialize<SamplePayload>(json);

        Assert.NotNull(deserialized);
        Assert.Equal(original.Id, deserialized.Id);
        Assert.Equal(original.EventName, deserialized.EventName);
    }

    [Fact]
    public void IsValid_WithValidJson_ReturnsTrue()
    {
        var validJson = "{\"id\":\"11111111-1111-1111-1111-111111111111\",\"eventName\":\"TEST\"}";

        Assert.True(OutboxPayloadSerializer.IsValid(validJson));
    }

    [Fact]
    public void IsValid_WithInvalidJson_ReturnsFalse()
    {
        var invalidJson = "not-a-json-string{";

        Assert.False(OutboxPayloadSerializer.IsValid(invalidJson));
    }

    [Fact]
    public void Deserialize_InvalidJson_ThrowsJsonException()
    {
        Assert.Throws<JsonException>(() => OutboxPayloadSerializer.Deserialize<SamplePayload>("bad-json"));
    }
}
