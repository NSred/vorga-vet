using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Appointments.MarkNoShow;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class MarkNoShow : IEndpoint
{
    public sealed class Request
    {
        public string? Note { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("appointments/{id:guid}/no-show", async (
            Guid id,
            Request request,
            ICommandHandler<MarkNoShowCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new MarkNoShowCommand(id, request.Note);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
