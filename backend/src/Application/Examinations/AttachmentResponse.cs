using Domain.Examinations;

namespace Application.Examinations;

public sealed class AttachmentResponse
{
    public Guid Id { get; set; }
    public AttachmentKind Kind { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}
