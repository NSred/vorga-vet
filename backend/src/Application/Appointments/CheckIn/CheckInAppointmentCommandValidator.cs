using FluentValidation;

namespace Application.Appointments.CheckIn;

internal sealed class CheckInAppointmentCommandValidator : AbstractValidator<CheckInAppointmentCommand>
{
    public CheckInAppointmentCommandValidator()
    {
        RuleFor(c => c.AppointmentId).NotEmpty();

        When(c => c.Owner?.Create is not null, () =>
        {
            RuleFor(c => c.Owner!.Create!.FirstName).NotEmpty().MaximumLength(100);
            RuleFor(c => c.Owner!.Create!.LastName).NotEmpty().MaximumLength(100);
            RuleFor(c => c.Owner!.Create!.PhoneNumber).NotEmpty().MaximumLength(30);
            RuleFor(c => c.Owner!.Create!.Address).NotEmpty().MaximumLength(200);
            RuleFor(c => c.Owner!.Create!.City).NotEmpty().MaximumLength(100);
            RuleFor(c => c.Owner!.Create!.Email)
                .EmailAddress()
                .MaximumLength(256)
                .When(c => !string.IsNullOrWhiteSpace(c.Owner!.Create!.Email));
        });

        When(c => c.Patient?.Create is not null, () =>
        {
            RuleFor(c => c.Patient!.Create!.BreedId).NotEmpty();
            RuleFor(c => c.Patient!.Create!.CardNumber).NotEmpty().MaximumLength(50);
            RuleFor(c => c.Patient!.Create!.Name).NotEmpty().MaximumLength(100);
            RuleFor(c => c.Patient!.Create!.Sex).IsInEnum();
            RuleFor(c => c.Patient!.Create!.Note).MaximumLength(1000);
        });
    }
}
