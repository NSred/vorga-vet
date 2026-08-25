using SharedKernel;

namespace Domain.Owners;

public sealed record OwnerCreatedDomainEvent(Guid OwnerId) : IDomainEvent;
