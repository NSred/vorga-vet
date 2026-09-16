using Application.Abstractions.Messaging;
using Application.Appointments.Reschedule;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class Reschedule : IEndpoint
{
    public sealed class Request
    {
        public DateTime StartsAt { get; set; }
        public int? DurationMinutes { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("appointments/{id:guid}/reschedule", async (
            Guid id,
            Request request,
            ICommandHandler<RescheduleAppointmentCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new RescheduleAppointmentCommand(id, request.StartsAt, request.DurationMinutes);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
