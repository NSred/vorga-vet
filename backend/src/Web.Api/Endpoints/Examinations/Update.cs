using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations;
using Application.Examinations.Update;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class Update : IEndpoint
{
    public sealed class Request
    {
        public ExaminationDetails Examination { get; set; } = null!;
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("examinations/{id:guid}", async (
            Guid id,
            Request request,
            ICommandHandler<UpdateExaminationCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateExaminationCommand(id, request.Examination);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
