using FluentValidation;

namespace Application.Patients.Delete;

public class DeletePatientCommandValidator : AbstractValidator<DeletePatientCommand>
{
    public DeletePatientCommandValidator()
    {
        RuleFor(c => c.PatientId).NotEmpty();
    }
}
