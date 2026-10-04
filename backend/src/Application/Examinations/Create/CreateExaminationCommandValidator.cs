using FluentValidation;

namespace Application.Examinations.Create;

internal sealed class CreateExaminationCommandValidator : AbstractValidator<CreateExaminationCommand>
{
    public CreateExaminationCommandValidator()
    {
        RuleFor(c => c.PatientId).NotEmpty();
        RuleFor(c => c.Examination).NotNull().SetValidator(new ExaminationDetailsValidator());
    }
}
