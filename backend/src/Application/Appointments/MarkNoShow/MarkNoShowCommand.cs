using Application.Abstractions.Messaging;

namespace Application.Appointments.MarkNoShow;

public sealed record MarkNoShowCommand(Guid AppointmentId, string? Note) : ICommand;
