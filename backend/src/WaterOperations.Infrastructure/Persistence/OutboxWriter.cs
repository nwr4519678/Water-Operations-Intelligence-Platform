using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Persistence;

public sealed class OutboxWriter(WaterOperationsDbContext db) : IOutboxWriter
{
    public async Task<Guid> EnqueueAsync(Guid? organizationId, string eventType, string payloadJson, CancellationToken cancellationToken = default)
    {
        var message = new OutboxMessage
        {
            OutboxMessageId = Guid.NewGuid(), OrganizationId = organizationId, OccurredAtUtc = DateTime.UtcNow,
            EventType = eventType, PayloadJson = payloadJson, AvailableAtUtc = DateTime.UtcNow
        };
        db.OutboxMessages.Add(message);
        await db.SaveChangesAsync(cancellationToken);
        return message.OutboxMessageId;
    }
}
