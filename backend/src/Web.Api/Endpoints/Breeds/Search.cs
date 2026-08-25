using Application.Abstractions.Messaging;
using Application.Breeds.Search;
using Domain.Breeds;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Breeds;

internal sealed class Search : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("breeds", async (
            int species,
            string? search,
            IQueryHandler<SearchBreedsQuery, List<SearchBreedsResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new SearchBreedsQuery((Species)species, search);

            Result<List<SearchBreedsResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Breeds)
        .RequireAuthorization();
    }
}
