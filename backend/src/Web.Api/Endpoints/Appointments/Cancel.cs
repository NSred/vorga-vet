using Application.Abstractions.Messaging;
using Application.Appointments.Cancel;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class Cancel : IEndpoint
{
    public sealed class Request
    {
        public string? Reason { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // Cancel replaces delete: the fact that time was held and then freed is history worth keeping.
        app.MapPost("appointments/{id:guid}/cancel", async (
            Guid id,
            Request request,
            ICommandHandler<CancelAppointmentCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CancelAppointmentCommand(id, request.Reason);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
