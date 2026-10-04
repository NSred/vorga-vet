using Application.Abstractions.Authentication;
using Application.Abstractions.Messaging;
using Application.Examinations;
using Application.Examinations.Create;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Examinations;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public Guid PatientId { get; set; }
        public ExaminationDetails Examination { get; set; } = null!;
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // A walk-in: recorded directly against a patient card, no appointment.
        app.MapPost("examinations", async (
            Request request,
            ICommandHandler<CreateExaminationCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateExaminationCommand(request.PatientId, request.Examination);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Examinations)
        .RequireAuthorization(Policies.Veterinarian);
    }
}
