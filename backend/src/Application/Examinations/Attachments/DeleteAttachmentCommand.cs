using Application.Abstractions.Messaging;

namespace Application.Examinations.Attachments;

public sealed record DeleteAttachmentCommand(Guid ExaminationId, Guid AttachmentId) : ICommand;
