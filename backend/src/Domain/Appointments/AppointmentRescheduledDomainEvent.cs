using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentRescheduledDomainEvent(Guid AppointmentId) : IDomainEvent;
