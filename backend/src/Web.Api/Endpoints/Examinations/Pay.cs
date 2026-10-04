using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations.Pay;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class Pay : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("examinations/{id:guid}/pay", async (
            Guid id,
            ICommandHandler<PayExaminationCommand> handler,
            CancellationToken cancellationToken) =>
        {
            Result result = await handler.Handle(new PayExaminationCommand(id), cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
