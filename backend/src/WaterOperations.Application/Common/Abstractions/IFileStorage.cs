namespace WaterOperations.Application.Common.Abstractions;

public interface IFileStorage
{
    public Task SaveAsync(
        string key,
        Stream content,
        CancellationToken cancellationToken = default);

    public Task<Stream?> OpenReadAsync(
        string key,
        CancellationToken cancellationToken = default);

    public Task DeleteAsync(
        string key,
        CancellationToken cancellationToken = default);
}
