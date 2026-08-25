using Application.Abstractions.Messaging;
using Application.Owners.Create;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Owners;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("owners", async (
            Request request,
            ICommandHandler<CreateOwnerCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateOwnerCommand
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                City = request.City
            };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Owners)
        .RequireAuthorization();
    }
}
