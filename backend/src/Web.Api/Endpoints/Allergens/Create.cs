using Application.Abstractions.Messaging;
using Application.Allergens.Create;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Allergens;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public string Name { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("allergens", async (
            Request request,
            ICommandHandler<CreateAllergenCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateAllergenCommand { Name = request.Name };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Allergens)
        .RequireAuthorization();
    }
}
