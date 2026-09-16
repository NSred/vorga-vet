using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentNoShowedDomainEvent(Guid AppointmentId) : IDomainEvent;
