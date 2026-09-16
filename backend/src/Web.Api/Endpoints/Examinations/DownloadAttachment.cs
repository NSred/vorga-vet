using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations.Attachments;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class DownloadAttachment : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("attachments/{id:guid}", async (
            Guid id,
            IQueryHandler<GetAttachmentContentQuery, AttachmentContent> handler,
            CancellationToken cancellationToken) =>
        {
            Result<AttachmentContent> result = await handler.Handle(new GetAttachmentContentQuery(id), cancellationToken);

            // Results.File takes ownership of the stream and disposes it after the response.
            return result.Match(
                content => Results.File(content.Content, content.ContentType, content.FileName),
                CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
