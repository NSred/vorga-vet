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

    public DateTime CreatedAt { get; private set; }

    // Lifecycle fields — CheckedInAt, ClosedAt, ClosedByUserId, ResolutionNote — arrive
    // in the lifecycle step alongside the CheckIn / Complete / Cancel / MarkNoShow methods
    // that set them, so no field exists without a use case that writes it.

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
}
