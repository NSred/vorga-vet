using Application.Abstractions.Messaging;
using Domain.Appointments;

namespace Application.Appointments.Create;

public sealed record CreateAppointmentCommand(
    Guid? OwnerId,
    Guid? PatientId,
    DateTime StartsAt,
    int DurationMinutes,
    AppointmentType Type,
    string? Reason) : ICommand<Guid>;
