using Application.Abstractions.Messaging;

namespace Application.Appointments.Get;

public sealed record GetAppointmentsQuery(DateTime From, DateTime To) : IQuery<List<AppointmentResponse>>;
