using FluentValidation;

namespace Application.Appointments.MarkNoShow;

internal sealed class MarkNoShowCommandValidator : AbstractValidator<MarkNoShowCommand>
{
    public MarkNoShowCommandValidator()
    {
        RuleFor(c => c.AppointmentId).NotEmpty();
        RuleFor(c => c.Note).MaximumLength(1000);
    }
}
