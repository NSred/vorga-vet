using Application.Abstractions.Messaging;
using Application.Appointments;
using Application.Appointments.GetById;
using SharedKernel;
using Web.Api.Endpoints;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class GetById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("appointments/{id:guid}", async (
            Guid id,
            IQueryHandler<GetAppointmentByIdQuery, AppointmentResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAppointmentByIdQuery(id);

            Result<AppointmentResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
