using Application.Examinations;
using FluentValidation;

namespace Application.Appointments.Complete;

internal sealed class CompleteAppointmentCommandValidator : AbstractValidator<CompleteAppointmentCommand>
{
    public CompleteAppointmentCommandValidator()
    {
        RuleFor(c => c.AppointmentId).NotEmpty();
        RuleFor(c => c.Examination).NotNull().SetValidator(new ExaminationDetailsValidator());
    }
}
