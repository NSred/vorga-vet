namespace Application.Abstractions.Storage;

/// <summary>
/// Where attachment bytes live. Deliberately opaque: the domain keeps only a storage key, so
/// the backing store (a mounted volume today; MinIO or S3 later) is a one-class swap.
/// </summary>
public interface IImageStorage
{
    /// <summary>Persists the content and returns the key to retrieve it by.</summary>
    Task<string> SaveAsync(Stream content, string contentType, CancellationToken cancellationToken);

    /// <summary>Opens the stored content for reading, or null if the key no longer exists.</summary>
    Task<Stream?> OpenAsync(string storageKey, CancellationToken cancellationToken);

    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}
