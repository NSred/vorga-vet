using Application.Abstractions.Messaging;
using Application.Patients.Delete;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Patients;

internal sealed class Delete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("patients/{id:guid}", async (
            Guid id,
            ICommandHandler<DeletePatientCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeletePatientCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Patients)
        .RequireAuthorization();
    }
}
