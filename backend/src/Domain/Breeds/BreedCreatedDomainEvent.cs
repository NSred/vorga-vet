using SharedKernel;

namespace Domain.Breeds;

public sealed record BreedCreatedDomainEvent(Guid BreedId) : IDomainEvent;
