using SharedKernel;

namespace Domain.Patients;

public sealed record PatientUpdatedDomainEvent(Guid PatientId) : IDomainEvent;
