using Domain.Breeds;
using Domain.Patients;

namespace Application.Patients.GetById;

public sealed class PatientDetailResponse
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid BreedId { get; set; }
    public string CardNumber { get; set; }
    public string Name { get; set; }
    public Species Species { get; set; }
    public string BreedName { get; set; }
    public Sex Sex { get; set; }
    public DateTime? BirthDate { get; set; }
    public decimal? WeightKg { get; set; }
    public string? Color { get; set; }
    public string? ChipNumber { get; set; }
    public string? Anamnesis { get; set; }
    public string? Note { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public string OwnerName { get; set; }
    public string PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string City { get; set; }
    public List<AllergenSummary> Allergies { get; set; } = [];
}
