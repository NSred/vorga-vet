using Application.Abstractions.Messaging;
using Application.Appointments.Resolution;

namespace Application.Appointments.CheckIn;

/// <summary>
/// The animal is in the building. A booking that was made without an owner or patient card
/// gets them here — this is where a self-registered client's thin booking becomes records.
/// </summary>
public sealed record CheckInAppointmentCommand(
    Guid AppointmentId,
    OwnerResolution? Owner,
    PatientResolution? Patient) : ICommand<CheckInAppointmentResponse>;

public sealed record CheckInAppointmentResponse(Guid OwnerId, Guid PatientId);
