using Application.Abstractions.Messaging;
using Application.Breeds.Create;
using Domain.Breeds;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Breeds;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public string Name { get; set; }
        public int Species { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("breeds", async (
            Request request,
            ICommandHandler<CreateBreedCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateBreedCommand
            {
                Name = request.Name,
                Species = (Species)request.Species
            };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Breeds)
        .RequireAuthorization();
    }
}
