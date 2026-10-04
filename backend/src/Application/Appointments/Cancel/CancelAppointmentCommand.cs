using Application.Abstractions.Messaging;

namespace Application.Appointments.Cancel;

public sealed record CancelAppointmentCommand(Guid AppointmentId, string? Reason) : ICommand;
