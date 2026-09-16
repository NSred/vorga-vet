using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations;
using Application.Examinations.GetById;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class GetById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("examinations/{id:guid}", async (
            Guid id,
            IQueryHandler<GetExaminationByIdQuery, ExaminationResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<ExaminationResponse> result = await handler.Handle(new GetExaminationByIdQuery(id), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
