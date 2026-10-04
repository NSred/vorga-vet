using SharedKernel;

namespace Domain.Appointments;

public sealed class Appointment : Entity
{
    public Guid Id { get; private set; }

    // Who created the booking — always set (a client, or the shared vet account). Audit,
    // and the scope key for a client's own bookings before an owner is resolved.
    public Guid CreatedByUserId { get; private set; }

    // Who it's for, once known. Null only for an unlinked client's self-booking,
    // resolved to a real owner at the visit.
    public Guid? OwnerId { get; private set; }

    // A recorded patient, or null when the animal isn't in the system yet.
    public Guid? PatientId { get; private set; }

    public DateTime StartsAt { get; private set; }
    public int DurationMinutes { get; private set; }

    // Stored, derived from StartsAt + DurationMinutes. The overlap exclusion constraint
    // builds its tstzrange from this column, so it must be a real column.
    public DateTime EndsAt { get; private set; }

    public AppointmentType Type { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public string? Reason { get; private set; }

    public DateTime? CheckedInAt { get; private set; }

    // Set when the appointment reaches a terminal status. Who closed it (and, via their
    // role, whether the clinic or the client did) matters the day a no-show is disputed.
    public DateTime? ClosedAt { get; private set; }
    public Guid? ClosedByUserId { get; private set; }

    // The cancellation reason or the no-show note — one field, whichever applies.
    public string? ResolutionNote { get; private set; }

    public DateTime CreatedAt { get; private set; }

    private Appointment() { } // EF Core

    public static Appointment Create(
        Guid createdByUserId,
        Guid? ownerId,
        Guid? patientId,
        DateTime startsAtUtc,
        int durationMinutes,
        AppointmentType type,
        string? reason,
        DateTime createdAtUtc)
    {
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            CreatedByUserId = createdByUserId,
            OwnerId = ownerId,
            PatientId = patientId,
            StartsAt = startsAtUtc,
            DurationMinutes = durationMinutes,
            EndsAt = startsAtUtc.AddMinutes(durationMinutes),
            Type = type,
            Status = AppointmentStatus.Scheduled,
            Reason = reason,
            CreatedAt = createdAtUtc
        };

        appointment.Raise(new AppointmentScheduledDomainEvent(appointment.Id));

        return appointment;
    }

    // Resolution at the visit: a thin self-booking gets its owner and patient card here.
    public void AttachOwner(Guid ownerId) => OwnerId = ownerId;

    public void AttachPatient(Guid patientId) => PatientId = patientId;

    // Transition guards live in the handlers (AppointmentStatusTransitions); these just mutate.
    public void CheckIn(DateTime atUtc)
    {
        Status = AppointmentStatus.CheckedIn;
        CheckedInAt = atUtc;

        Raise(new AppointmentCheckedInDomainEvent(Id));
    }

    public void Complete(DateTime atUtc, Guid byUserId)
    {
        Status = AppointmentStatus.Completed;
        ClosedAt = atUtc;
        ClosedByUserId = byUserId;

        Raise(new AppointmentCompletedDomainEvent(Id));
    }

    public void MarkNoShow(DateTime atUtc, Guid byUserId, string? note)
    {
        Status = AppointmentStatus.NoShow;
        ClosedAt = atUtc;
        ClosedByUserId = byUserId;
        ResolutionNote = note;

        Raise(new AppointmentNoShowedDomainEvent(Id));
    }

    public void Cancel(DateTime atUtc, Guid byUserId, string? reason)
    {
        Status = AppointmentStatus.Cancelled;
        ClosedAt = atUtc;
        ClosedByUserId = byUserId;
        ResolutionNote = reason;

        Raise(new AppointmentCancelledDomainEvent(Id));
    }

    public void Reschedule(DateTime newStartsAtUtc, int durationMinutes)
    {
        StartsAt = newStartsAtUtc;
        DurationMinutes = durationMinutes;
        EndsAt = newStartsAtUtc.AddMinutes(durationMinutes);

        Raise(new AppointmentRescheduledDomainEvent(Id));
    }
}
