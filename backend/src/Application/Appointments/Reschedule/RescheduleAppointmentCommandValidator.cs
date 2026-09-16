using FluentValidation;

namespace Application.Appointments.Reschedule;

internal sealed class RescheduleAppointmentCommandValidator : AbstractValidator<RescheduleAppointmentCommand>
{
    public RescheduleAppointmentCommandValidator()
    {
        RuleFor(c => c.AppointmentId).NotEmpty();

        RuleFor(c => c.StartsAt)
            .Must(BeAlignedToHalfHour)
            .WithMessage("StartsAt must fall on a 30-minute boundary (minute 00 or 30, no seconds).");

        RuleFor(c => c.DurationMinutes!.Value)
            .GreaterThan(0)
            .Must(minutes => minutes % 30 == 0)
            .WithMessage("DurationMinutes must be a positive multiple of 30.")
            .LessThanOrEqualTo(480)
            .When(c => c.DurationMinutes.HasValue);
    }

    private static bool BeAlignedToHalfHour(DateTime startsAt) =>
        startsAt.Minute is 0 or 30 &&
        startsAt.Second == 0 &&
        startsAt.Millisecond == 0 &&
        startsAt.Microsecond == 0;
}
