using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Abstractions.Storage;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Attachments;

internal sealed class UploadAttachmentCommandHandler(
    IApplicationDbContext context,
    IImageStorage storage,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<UploadAttachmentCommand, Guid>
{
    private const long MaxSizeBytes = 20 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public async Task<Result<Guid>> Handle(UploadAttachmentCommand command, CancellationToken cancellationToken)
    {
        if (!AllowedContentTypes.Contains(command.ContentType))
        {
            return Result.Failure<Guid>(AttachmentErrors.UnsupportedContentType);
        }

        if (command.SizeBytes <= 0)
        {
            return Result.Failure<Guid>(AttachmentErrors.EmptyFile);
        }

        if (command.SizeBytes > MaxSizeBytes)
        {
            return Result.Failure<Guid>(AttachmentErrors.FileTooLarge);
        }

        Guid? patientId = await context.Examinations
            .Where(e => e.Id == command.ExaminationId)
            .Select(e => (Guid?)e.PatientId)
            .FirstOrDefaultAsync(cancellationToken);

        if (patientId is null)
        {
            return Result.Failure<Guid>(ExaminationErrors.NotFound(command.ExaminationId));
        }

        string storageKey = await storage.SaveAsync(command.Content, command.ContentType, cancellationToken);

        var attachment = Attachment.Create(
            command.ExaminationId,
            patientId.Value,
            command.Kind,
            command.FileName,
            command.ContentType,
            command.SizeBytes,
            storageKey,
            dateTimeProvider.UtcNow);

        context.Attachments.Add(attachment);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Don't leave an orphaned file behind a row that never landed.
            await storage.DeleteAsync(storageKey, CancellationToken.None);
            throw;
        }

        return attachment.Id;
    }
}
