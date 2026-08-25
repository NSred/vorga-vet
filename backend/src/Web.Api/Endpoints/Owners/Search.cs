using Application.Abstractions.Messaging;
using Application.Owners.Search;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Owners;

internal sealed class Search : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("owners", async (
            string? search,
            IQueryHandler<SearchOwnersQuery, List<SearchOwnersResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new SearchOwnersQuery(search);

            Result<List<SearchOwnersResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Owners)
        .RequireAuthorization();
    }
}
