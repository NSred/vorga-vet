using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Appointments;
using Application.Appointments.GetUnresolved;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class GetUnresolved : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("appointments/unresolved", async (
            IQueryHandler<GetUnresolvedAppointmentsQuery, List<AppointmentResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            Result<List<AppointmentResponse>> result =
                await handler.Handle(new GetUnresolvedAppointmentsQuery(), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
