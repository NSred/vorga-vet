using Application.Abstractions.Messaging;
using Domain.Breeds;

namespace Application.Breeds.Search;

public sealed record SearchBreedsQuery(Species Species, string? SearchTerm) : IQuery<List<SearchBreedsResponse>>;
