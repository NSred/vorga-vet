using Application.Abstractions.Messaging;
using Application.Appointments.Create;
using Domain.Appointments;
using SharedKernel;
using Web.Api.Endpoints;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public Guid? OwnerId { get; set; }
        public Guid? PatientId { get; set; }
        public DateTime StartsAt { get; set; }
        public int DurationMinutes { get; set; }
        public int Type { get; set; }
        public string? Reason { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("appointments", async (
            Request request,
            ICommandHandler<CreateAppointmentCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateAppointmentCommand(
                request.OwnerId,
                request.PatientId,
                request.StartsAt,
                request.DurationMinutes,
                (AppointmentType)request.Type,
                request.Reason);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
