using Application.Abstractions.Messaging;

namespace Application.Appointments.GetById;

public sealed record GetAppointmentByIdQuery(Guid AppointmentId) : IQuery<AppointmentResponse>;
