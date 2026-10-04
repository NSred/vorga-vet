using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations.Attachments;
using Domain.Examinations;
using Microsoft.AspNetCore.Mvc;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class UploadAttachment : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // multipart/form-data: `file` (the image) and `kind` (0 = X-ray, 1 = ultrasound).
        app.MapPost("examinations/{id:guid}/attachments", async (
            Guid id,
            IFormFile file,
            [FromForm] int kind,
            ICommandHandler<UploadAttachmentCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            await using Stream content = file.OpenReadStream();

            var command = new UploadAttachmentCommand(
                id,
                (AttachmentKind)kind,
                file.FileName,
                file.ContentType,
                file.Length,
                content);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .DisableAntiforgery()
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
