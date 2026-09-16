using FluentValidation;

namespace Application.Examinations.Update;

internal sealed class UpdateExaminationCommandValidator : AbstractValidator<UpdateExaminationCommand>
{
    public UpdateExaminationCommandValidator()
    {
        RuleFor(c => c.ExaminationId).NotEmpty();
        RuleFor(c => c.Examination).NotNull().SetValidator(new ExaminationDetailsValidator());
    }
}
