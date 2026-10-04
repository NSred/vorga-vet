using SharedKernel;

namespace Domain.Examinations;

/// <summary>
/// What actually happened at a visit. Created when an appointment is completed (the complete
/// command carries this payload) or directly for a walk-in, which has no appointment behind it.
/// </summary>
public sealed class Examination : Entity
{
    public Guid Id { get; private set; }

    // By examination time the animal always has a card — check-in / complete guarantee it.
    public Guid PatientId { get; private set; }

    // Null for a walk-in. Unique when set: one examination per appointment.
    public Guid? AppointmentId { get; private set; }

    // Which vet did it — plain text while there is one shared clinic account. If real vet
    // accounts ever arrive this gains an optional FK beside it; the text stays as history.
    public string PerformedByFirstName { get; private set; }
    public string PerformedByLastName { get; private set; }

    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }

    public string? Anamnesis { get; private set; }
    public string? Diagnosis { get; private set; }
    public string? Therapy { get; private set; }

    // Flat billing for now: what it cost and whether it's settled. One implied currency.
    public decimal? Cost { get; private set; }
    public bool IsPaid { get; private set; }
    public DateTime? PaidAt { get; private set; }

    public DateTime CreatedAt { get; private set; }

    private Examination() { } // EF Core

    public static Examination Create(
        Guid patientId,
        Guid? appointmentId,
        string performedByFirstName,
        string performedByLastName,
        DateTime startedAtUtc,
        DateTime? endedAtUtc,
        string? anamnesis,
        string? diagnosis,
        string? therapy,
        decimal? cost,
        DateTime createdAtUtc)
    {
        var examination = new Examination
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            AppointmentId = appointmentId,
            PerformedByFirstName = performedByFirstName,
            PerformedByLastName = performedByLastName,
            StartedAt = startedAtUtc,
            EndedAt = endedAtUtc,
            Anamnesis = anamnesis,
            Diagnosis = diagnosis,
            Therapy = therapy,
            Cost = cost,
            IsPaid = false,
            CreatedAt = createdAtUtc
        };

        examination.Raise(new ExaminationRecordedDomainEvent(examination.Id));

        return examination;
    }

    public void UpdateDetails(
        string performedByFirstName,
        string performedByLastName,
        string? anamnesis,
        string? diagnosis,
        string? therapy,
        decimal? cost)
    {
        PerformedByFirstName = performedByFirstName;
        PerformedByLastName = performedByLastName;
        Anamnesis = anamnesis;
        Diagnosis = diagnosis;
        Therapy = therapy;
        Cost = cost;
    }

    public void MarkPaid(DateTime paidAtUtc)
    {
        IsPaid = true;
        PaidAt = paidAtUtc;

        Raise(new ExaminationPaidDomainEvent(Id));
    }
}
