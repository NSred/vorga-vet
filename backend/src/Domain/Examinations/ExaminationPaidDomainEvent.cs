using SharedKernel;

namespace Domain.Examinations;

public sealed record ExaminationPaidDomainEvent(Guid ExaminationId) : IDomainEvent;
