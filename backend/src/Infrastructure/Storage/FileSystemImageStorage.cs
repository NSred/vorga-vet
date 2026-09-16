using System.Globalization;
using Application.Abstractions.Storage;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Storage;

/// <summary>
/// Attachments on a local directory (a mounted volume in Compose). Keys are relative paths
/// like <c>2026/09/{guid}.jpg</c>; every open/delete is confined to the configured root.
/// </summary>
internal sealed class FileSystemImageStorage : IImageStorage
{
    private static readonly Dictionary<string, string> ExtensionsByContentType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp"
    };

    private readonly string _rootPath;

    public FileSystemImageStorage(IConfiguration configuration)
    {
        string configured = configuration["Storage:ImagesRootPath"] ?? Path.Combine("storage", "images");

        _rootPath = Path.GetFullPath(configured);
    }

    public async Task<string> SaveAsync(Stream content, string contentType, CancellationToken cancellationToken)
    {
        string extension = ExtensionsByContentType.TryGetValue(contentType, out string? known) ? known : ".bin";
        DateTime now = DateTime.UtcNow;
        string relativeDirectory = Path.Combine(
            now.ToString("yyyy", CultureInfo.InvariantCulture),
            now.ToString("MM", CultureInfo.InvariantCulture));
        string fileName = $"{Guid.NewGuid():N}{extension}";

        string directory = Path.Combine(_rootPath, relativeDirectory);
        Directory.CreateDirectory(directory);

        string fullPath = Path.Combine(directory, fileName);

        await using (FileStream file = new(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await content.CopyToAsync(file, cancellationToken);
        }

        return Path.Combine(relativeDirectory, fileName).Replace('\\', '/');
    }

    public Task<Stream?> OpenAsync(string storageKey, CancellationToken cancellationToken)
    {
        string fullPath = ResolveInsideRoot(storageKey);

        if (!File.Exists(fullPath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);

        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        string fullPath = ResolveInsideRoot(storageKey);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    // A key is data from the database, but never let one escape the root directory.
    private string ResolveInsideRoot(string storageKey)
    {
        string fullPath = Path.GetFullPath(Path.Combine(_rootPath, storageKey));

        if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Storage key resolves outside the storage root.");
        }

        return fullPath;
    }
}
