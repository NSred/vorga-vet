using Application.Abstractions.Messaging;
using Application.Appointments.Resolution;
using Application.Examinations;

namespace Application.Appointments.Complete;

/// <summary>
/// Completing the appointment <em>is</em> recording the examination: the payload rides on the
/// command and both are written in one transaction. (A post-commit domain event could leave a
/// Completed appointment with no examination if its handler failed.) The resolution blocks
/// cover the case where check-in was skipped and the booking is still thin.
/// </summary>
public sealed record CompleteAppointmentCommand(
    Guid AppointmentId,
    OwnerResolution? Owner,
    PatientResolution? Patient,
    ExaminationDetails Examination) : ICommand<Guid>;
