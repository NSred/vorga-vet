using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Owners;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Owners.Search;

internal sealed class SearchOwnersQueryHandler(IApplicationDbContext context)
    : IQueryHandler<SearchOwnersQuery, List<SearchOwnersResponse>>
{
    private const int MaxResults = 20;

    public async Task<Result<List<SearchOwnersResponse>>> Handle(
        SearchOwnersQuery query,
        CancellationToken cancellationToken)
    {
        IQueryable<Owner> ownersQuery = context.Owners.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            string term = query.SearchTerm.Trim();

            ownersQuery = ownersQuery.Where(o =>
                EF.Functions.ILike(o.FirstName, $"%{term}%") ||
                EF.Functions.ILike(o.LastName, $"%{term}%") ||
                EF.Functions.ILike(o.FirstName + " " + o.LastName, $"%{term}%"));
        }

        List<SearchOwnersResponse> owners = await ownersQuery
            .OrderBy(o => o.LastName)
            .ThenBy(o => o.FirstName)
            .Take(MaxResults)
            .Select(o => new SearchOwnersResponse
            {
                Id = o.Id,
                FirstName = o.FirstName,
                LastName = o.LastName,
                PhoneNumber = o.PhoneNumber
            })
            .ToListAsync(cancellationToken);

        return owners;
    }
}
