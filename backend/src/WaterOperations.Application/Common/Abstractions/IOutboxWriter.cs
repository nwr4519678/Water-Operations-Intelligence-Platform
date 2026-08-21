namespace WaterOperations.Application.Common.Abstractions;

public interface IOutboxWriter
{
    Task<Guid> EnqueueAsync(Guid? organizationId, string eventType, string payloadJson, CancellationToken cancellationToken = default);
}
