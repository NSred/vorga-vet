using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentScheduledDomainEvent(Guid AppointmentId) : IDomainEvent;
