using Application.Abstractions.Messaging;
using Application.Allergens.Search;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Allergens;

internal sealed class Search : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("allergens", async (
            string? search,
            IQueryHandler<SearchAllergensQuery, List<SearchAllergensResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new SearchAllergensQuery(search);

            Result<List<SearchAllergensResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Allergens)
        .RequireAuthorization();
    }
}
