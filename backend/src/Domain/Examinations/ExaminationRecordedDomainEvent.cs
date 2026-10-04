using SharedKernel;

namespace Domain.Examinations;

public sealed record ExaminationRecordedDomainEvent(Guid ExaminationId) : IDomainEvent;
