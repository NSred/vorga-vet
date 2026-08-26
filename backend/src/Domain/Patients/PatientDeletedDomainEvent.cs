using SharedKernel;

namespace Domain.Patients;

public sealed record PatientDeletedDomainEvent(Guid PatientId) : IDomainEvent;
