using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Abstractions.Storage;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Attachments;

internal sealed class DeleteAttachmentCommandHandler(IApplicationDbContext context, IImageStorage storage)
    : ICommandHandler<DeleteAttachmentCommand>
{
    public async Task<Result> Handle(DeleteAttachmentCommand command, CancellationToken cancellationToken)
    {
        Attachment? attachment = await context.Attachments
            .SingleOrDefaultAsync(
                a => a.Id == command.AttachmentId && a.ExaminationId == command.ExaminationId,
                cancellationToken);

        if (attachment is null)
        {
            return Result.Failure(AttachmentErrors.NotFound(command.AttachmentId));
        }

        context.Attachments.Remove(attachment);

        await context.SaveChangesAsync(cancellationToken);

        // The row is authoritative; the bytes go afterwards so a storage hiccup can't resurrect a deleted record.
        await storage.DeleteAsync(attachment.StorageKey, cancellationToken);

        return Result.Success();
    }
}
