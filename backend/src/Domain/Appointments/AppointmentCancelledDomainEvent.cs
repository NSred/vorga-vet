using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentCancelledDomainEvent(Guid AppointmentId) : IDomainEvent;
