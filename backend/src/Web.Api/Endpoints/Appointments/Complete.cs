using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Appointments.Complete;
using Application.Appointments.Resolution;
using Application.Examinations;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class Complete : IEndpoint
{
    public sealed class Request
    {
        // Needed only if the booking is still thin (check-in skipped).
        public OwnerResolution? Owner { get; set; }
        public PatientResolution? Patient { get; set; }

        public ExaminationDetails Examination { get; set; } = null!;
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // Returns the id of the examination that was recorded.
        app.MapPost("appointments/{id:guid}/complete", async (
            Guid id,
            Request request,
            ICommandHandler<CompleteAppointmentCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CompleteAppointmentCommand(id, request.Owner, request.Patient, request.Examination);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
