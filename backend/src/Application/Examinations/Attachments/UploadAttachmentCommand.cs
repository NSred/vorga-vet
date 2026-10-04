using Application.Abstractions.Messaging;
using Domain.Examinations;

namespace Application.Examinations.Attachments;

/// <summary>
/// Attaches an X-ray or ultrasound image to an examination. The stream is read once, into
/// storage; only the resulting key is persisted.
/// </summary>
public sealed record UploadAttachmentCommand(
    Guid ExaminationId,
    AttachmentKind Kind,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content) : ICommand<Guid>;
