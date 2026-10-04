using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Allergens;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Allergens.Search;

internal sealed class SearchAllergensQueryHandler(IApplicationDbContext context)
    : IQueryHandler<SearchAllergensQuery, List<SearchAllergensResponse>>
{
    private const int MaxResults = 20;

    public async Task<Result<List<SearchAllergensResponse>>> Handle(
        SearchAllergensQuery query,
        CancellationToken cancellationToken)
    {
        IQueryable<Allergen> allergensQuery = context.Allergens.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            string term = query.SearchTerm.Trim();

            allergensQuery = allergensQuery.Where(a => EF.Functions.ILike(a.Name, $"%{term}%"));
        }

        List<SearchAllergensResponse> allergens = await allergensQuery
            .OrderBy(a => a.Name)
            .Take(MaxResults)
            .Select(a => new SearchAllergensResponse
            {
                Id = a.Id,
                Name = a.Name
            })
            .ToListAsync(cancellationToken);

        return allergens;
    }
}
