using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Appointments.CheckIn;
using Application.Appointments.Resolution;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class CheckIn : IEndpoint
{
    public sealed class Request
    {
        // Both blocks are optional: required only when the booking has no owner / patient yet.
        public OwnerResolution? Owner { get; set; }
        public PatientResolution? Patient { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("appointments/{id:guid}/check-in", async (
            Guid id,
            Request request,
            ICommandHandler<CheckInAppointmentCommand, CheckInAppointmentResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CheckInAppointmentCommand(id, request.Owner, request.Patient);

            Result<CheckInAppointmentResponse> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
