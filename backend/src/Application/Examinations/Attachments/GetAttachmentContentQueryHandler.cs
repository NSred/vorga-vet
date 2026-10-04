using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Abstractions.Storage;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Attachments;

internal sealed class GetAttachmentContentQueryHandler(IApplicationDbContext context, IImageStorage storage)
    : IQueryHandler<GetAttachmentContentQuery, AttachmentContent>
{
    public async Task<Result<AttachmentContent>> Handle(
        GetAttachmentContentQuery query,
        CancellationToken cancellationToken)
    {
        var attachment = await context.Attachments
            .AsNoTracking()
            .Where(a => a.Id == query.AttachmentId)
            .Select(a => new { a.StorageKey, a.ContentType, a.FileName })
            .FirstOrDefaultAsync(cancellationToken);

        if (attachment is null)
        {
            return Result.Failure<AttachmentContent>(AttachmentErrors.NotFound(query.AttachmentId));
        }

        Stream? content = await storage.OpenAsync(attachment.StorageKey, cancellationToken);

        if (content is null)
        {
            return Result.Failure<AttachmentContent>(AttachmentErrors.ContentMissing);
        }

        return Result.Success(new AttachmentContent(content, attachment.ContentType, attachment.FileName));
    }
}
