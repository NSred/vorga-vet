using SharedKernel;

namespace Domain.Appointments;

public sealed record AppointmentCheckedInDomainEvent(Guid AppointmentId) : IDomainEvent;
