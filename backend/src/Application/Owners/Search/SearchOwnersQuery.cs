using Application.Abstractions.Messaging;

namespace Application.Owners.Search;

public sealed record SearchOwnersQuery(string? SearchTerm) : IQuery<List<SearchOwnersResponse>>;
