using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations;
using Application.Examinations.GetForPatient;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class GetForPatient : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // Vet-only for now; a client's view of their own animal's results is a deliberate later decision.
        app.MapGet("patients/{id:guid}/examinations", async (
            Guid id,
            IQueryHandler<GetPatientExaminationsQuery, List<ExaminationResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            Result<List<ExaminationResponse>> result =
                await handler.Handle(new GetPatientExaminationsQuery(id), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
