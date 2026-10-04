using FluentValidation;

namespace Application.Patients.Update;

public class UpdatePatientCommandValidator : AbstractValidator<UpdatePatientCommand>
{
    public UpdatePatientCommandValidator()
    {
        RuleFor(c => c.PatientId).NotEmpty();
        RuleFor(c => c.OwnerId).NotEmpty();
        RuleFor(c => c.BreedId).NotEmpty();
        RuleFor(c => c.CardNumber).NotEmpty().MaximumLength(20);
        RuleFor(c => c.Name).NotEmpty().MaximumLength(100);
        RuleFor(c => c.Sex).IsInEnum();
        RuleFor(c => c.WeightKg).GreaterThan(0).When(c => c.WeightKg.HasValue);
        RuleFor(c => c.BirthDate).LessThanOrEqualTo(DateTime.Today).When(c => c.BirthDate.HasValue);
    }
}
