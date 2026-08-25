using SharedKernel;

namespace Domain.Patients;

public sealed class PatientAllergen : Entity
{
    public Guid Id { get; private set; }
    public Guid PatientId { get; private set; }
    public Guid AllergenId { get; private set; }

    private PatientAllergen() { } // EF Core

    public static PatientAllergen Create(Guid patientId, Guid allergenId) => new()
    {
        Id = Guid.NewGuid(),
        PatientId = patientId,
        AllergenId = allergenId
    };
}
