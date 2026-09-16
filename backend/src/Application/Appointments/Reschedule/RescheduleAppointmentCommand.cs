using Application.Abstractions.Messaging;

namespace Application.Appointments.Reschedule;

/// <summary>
/// Moves a still-scheduled appointment. Its own slice rather than part of update: the time
/// rules re-run in full, and rescheduling raises its own event (a reminder job would care).
/// </summary>
public sealed record RescheduleAppointmentCommand(Guid AppointmentId, DateTime StartsAt, int? DurationMinutes) : ICommand;
