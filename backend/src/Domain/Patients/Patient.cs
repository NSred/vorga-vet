using SharedKernel;

namespace Domain.Patients;

public sealed class Patient : Entity
{
    public Guid Id { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid BreedId { get; private set; }
    public string CardNumber { get; private set; }
    public string Name { get; private set; }
    public Sex Sex { get; private set; }
    public DateTime? BirthDate { get; private set; }
    public decimal? WeightKg { get; private set; }
    public string? Color { get; private set; }
    public string? ChipNumber { get; private set; }
    public string? Anamnesis { get; private set; }
    public string? Note { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    private Patient() { } // EF Core

    public static Patient Create(
        Guid ownerId,
        Guid breedId,
        string cardNumber,
        string name,
        Sex sex,
        DateTime? birthDate,
        decimal? weightKg,
        string? color,
        string? chipNumber,
        string? anamnesis,
        string? note,
        DateTime createdAtUtc)
    {
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            BreedId = breedId,
            CardNumber = cardNumber,
            Name = name,
            Sex = sex,
            BirthDate = birthDate,
            WeightKg = weightKg,
            Color = color,
            ChipNumber = chipNumber,
            Anamnesis = anamnesis,
            Note = note,
            CreatedAt = createdAtUtc,
            IsDeleted = false,
            DeletedAt = null
        };

        patient.Raise(new PatientCreatedDomainEvent(patient.Id));

        return patient;
    }

    public void UpdateDetails(
        Guid ownerId,
        Guid breedId,
        string cardNumber,
        string name,
        Sex sex,
        DateTime? birthDate,
        decimal? weightKg,
        string? color,
        string? chipNumber,
        string? anamnesis,
        string? note)
    {
        OwnerId = ownerId;
        BreedId = breedId;
        CardNumber = cardNumber;
        Name = name;
        Sex = sex;
        BirthDate = birthDate;
        WeightKg = weightKg;
        Color = color;
        ChipNumber = chipNumber;
        Anamnesis = anamnesis;
        Note = note;

        Raise(new PatientUpdatedDomainEvent(Id));
    }

    public void MarkDeleted(DateTime deletedAtUtc)
    {
        IsDeleted = true;
        DeletedAt = deletedAtUtc;

        Raise(new PatientDeletedDomainEvent(Id));
    }
}
