using Application.Abstractions.Messaging;

namespace Application.Allergens.Search;

public sealed record SearchAllergensQuery(string? SearchTerm) : IQuery<List<SearchAllergensResponse>>;
