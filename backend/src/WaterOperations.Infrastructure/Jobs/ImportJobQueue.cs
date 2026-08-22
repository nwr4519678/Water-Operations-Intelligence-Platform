using System.Threading.Channels;
using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Infrastructure.Jobs;

public sealed record ImportJobWorkItem(string JobKey, IngestionBatchRequest Request);

public sealed class ImportJobQueue
{
    private readonly Channel<ImportJobWorkItem> channel = Channel.CreateBounded<ImportJobWorkItem>(new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true });
    public ValueTask EnqueueAsync(ImportJobWorkItem item, CancellationToken cancellationToken) => channel.Writer.WriteAsync(item, cancellationToken);
    public IAsyncEnumerable<ImportJobWorkItem> ReadAllAsync(CancellationToken cancellationToken) => channel.Reader.ReadAllAsync(cancellationToken);
}
