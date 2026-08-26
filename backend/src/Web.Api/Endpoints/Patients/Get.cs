using Application.Abstractions.Messaging;
using Application.Patients.Get;
using Domain.Breeds;
using Domain.Patients;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Patients;

internal sealed class Get : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("patients", async (
            string? search,
            int? species,
            int? sex,
            Guid? allergenId,
            string? city,
            IQueryHandler<GetPatientsQuery, GetPatientsResponse> handler,
            CancellationToken cancellationToken,
            int status = 0,
            int page = 1,
            int pageSize = 10) =>
        {
            var query = new GetPatientsQuery(
                search,
                species is null ? null : (Species)species,
                sex is null ? null : (Sex)sex,
                allergenId,
                city,
                (PatientStatusFilter)status,
                page,
                pageSize);

            Result<GetPatientsResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Patients)
        .RequireAuthorization();
    }
}
