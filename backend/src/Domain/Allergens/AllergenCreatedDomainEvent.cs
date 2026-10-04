using SharedKernel;

namespace Domain.Allergens;

public sealed record AllergenCreatedDomainEvent(Guid AllergenId) : IDomainEvent;
