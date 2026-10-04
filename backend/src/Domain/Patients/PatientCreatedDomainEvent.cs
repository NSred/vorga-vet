using SharedKernel;

namespace Domain.Patients;

public sealed record PatientCreatedDomainEvent(Guid PatientId) : IDomainEvent;
