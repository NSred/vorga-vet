using FluentValidation;

namespace Application.Appointments.Cancel;

internal sealed class CancelAppointmentCommandValidator : AbstractValidator<CancelAppointmentCommand>
{
    public CancelAppointmentCommandValidator()
    {
        RuleFor(c => c.AppointmentId).NotEmpty();
        RuleFor(c => c.Reason).MaximumLength(1000);
    }
}
