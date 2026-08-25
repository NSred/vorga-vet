using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Breeds;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Breeds.Search;

internal sealed class SearchBreedsQueryHandler(IApplicationDbContext context)
    : IQueryHandler<SearchBreedsQuery, List<SearchBreedsResponse>>
{
    private const int MaxResults = 20;

    public async Task<Result<List<SearchBreedsResponse>>> Handle(
        SearchBreedsQuery query,
        CancellationToken cancellationToken)
    {
        IQueryable<Breed> breedsQuery = context.Breeds.AsNoTracking().Where(b => b.Species == query.Species);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            string term = query.SearchTerm.Trim();

            breedsQuery = breedsQuery.Where(b => EF.Functions.ILike(b.Name, $"%{term}%"));
        }

        List<SearchBreedsResponse> breeds = await breedsQuery
            .OrderBy(b => b.Name)
            .Take(MaxResults)
            .Select(b => new SearchBreedsResponse
            {
                Id = b.Id,
                Name = b.Name
            })
            .ToListAsync(cancellationToken);

        return breeds;
    }
}
