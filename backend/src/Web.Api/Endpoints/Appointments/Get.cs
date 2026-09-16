using Application.Abstractions.Messaging;
using Application.Appointments;
using Application.Appointments.Get;
using SharedKernel;
using Web.Api.Endpoints;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class Get : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("appointments", async (
            DateTime from,
            DateTime to,
            IQueryHandler<GetAppointmentsQuery, List<AppointmentResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAppointmentsQuery(from, to);

            Result<List<AppointmentResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
