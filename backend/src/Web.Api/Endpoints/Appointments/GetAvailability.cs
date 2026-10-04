using Application.Abstractions.Messaging;
using Application.Appointments.GetAvailability;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Appointments;

internal sealed class GetAvailability : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("appointments/availability", async (
            DateTime from,
            DateTime to,
            int? durationMinutes,
            IQueryHandler<GetAvailabilityQuery, List<AvailabilitySlotResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAvailabilityQuery(from, to, durationMinutes);

            Result<List<AvailabilitySlotResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Appointments)
        .RequireAuthorization();
    }
}
