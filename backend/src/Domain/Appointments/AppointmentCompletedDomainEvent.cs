using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentCompletedDomainEvent(Guid AppointmentId) : IDomainEvent;
