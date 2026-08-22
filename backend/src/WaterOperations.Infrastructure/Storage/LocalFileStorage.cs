using Microsoft.Extensions.Options;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Configuration;

namespace WaterOperations.Infrastructure.Storage;

public sealed class LocalFileStorage(IOptions<InfrastructureOptions> options) : IFileStorage
{
    private readonly string rootPath = ResolveRoot(options.Value);

    public async Task SaveAsync(
        string key,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var path = ResolvePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var target = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            81920,
            useAsync: true);
        await content.CopyToAsync(target, cancellationToken);
    }

    public Task<Stream?> OpenReadAsync(
        string key,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = ResolvePath(key);
        if (!File.Exists(path))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            81920,
            useAsync: true);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(
        string key,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = ResolvePath(key);
        if (File.Exists(path))
        {
            File.Delete(path);
        }

        return Task.CompletedTask;
    }

    private string ResolvePath(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("A storage key is required.", nameof(key));
        }

        var path = Path.GetFullPath(Path.Combine(rootPath, key));
        if (!path.StartsWith(rootPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("The storage key must remain within the configured storage root.", nameof(key));
        }

        return path;
    }

    private static string ResolveRoot(InfrastructureOptions options)
    {
        var configuredRoot = options.StorageRootPath;
        var root = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(AppContext.BaseDirectory, "storage")
            : configuredRoot;
        return Path.GetFullPath(root);
    }
}
