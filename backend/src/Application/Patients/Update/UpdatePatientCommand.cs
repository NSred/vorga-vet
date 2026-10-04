using Application.Abstractions.Messaging;
using Domain.Patients;

namespace Application.Patients.Update;

public sealed class UpdatePatientCommand : ICommand
{
    public Guid PatientId { get; set; }
    public Guid OwnerId { get; set; }
    public Guid BreedId { get; set; }
    public string CardNumber { get; set; }
    public string Name { get; set; }
    public Sex Sex { get; set; }
    public DateTime? BirthDate { get; set; }
    public decimal? WeightKg { get; set; }
    public string? Color { get; set; }
    public string? ChipNumber { get; set; }
    public string? Anamnesis { get; set; }
    public string? Note { get; set; }
    public List<Guid> AllergenIds { get; set; } = [];
}
