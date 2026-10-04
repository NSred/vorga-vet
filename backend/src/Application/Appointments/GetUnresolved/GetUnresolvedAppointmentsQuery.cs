using Application.Abstractions.Messaging;

namespace Application.Appointments.GetUnresolved;

/// <summary>
/// Appointments whose time has passed while still Scheduled — nobody has said whether the
/// animal came. Derived, never stored, and closed out by a person rather than a nightly job.
/// </summary>
public sealed record GetUnresolvedAppointmentsQuery : IQuery<List<AppointmentResponse>>;
