using Application.Abstractions.Messaging;

namespace Application.Examinations.Attachments;

public sealed record GetAttachmentContentQuery(Guid AttachmentId) : IQuery<AttachmentContent>;

/// <summary>The bytes plus what the HTTP layer needs to serve them. The caller owns the stream.</summary>
public sealed record AttachmentContent(Stream Content, string ContentType, string FileName);
