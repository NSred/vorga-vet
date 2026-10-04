using Application.Abstractions.Messaging;
using Application.Patients.GetById;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Patients;

internal sealed class GetById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("patients/{id:guid}", async (
            Guid id,
            IQueryHandler<GetPatientByIdQuery, PatientDetailResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetPatientByIdQuery(id);

            Result<PatientDetailResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Patients)
        .RequireAuthorization();
    }
}
