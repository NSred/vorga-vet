using Application.Appointments.Create;
using Domain.Appointments;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Appointments;

public sealed class CreateAppointmentCommandValidatorTests
{
    private readonly CreateAppointmentCommandValidator _validator = new();

    private static CreateAppointmentCommand Command(DateTime startsAt, int durationMinutes) =>
        new(null, null, startsAt, durationMinutes, AppointmentType.Checkup, null);

    [Fact]
    public void Should_Pass_WhenAlignedAndThirtyMinutes()
    {
        CreateAppointmentCommand command = Command(new DateTime(2026, 9, 10, 9, 30, 0, DateTimeKind.Utc), 30);

        TestValidationResult<CreateAppointmentCommand> result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(9, 15)]
    [InlineData(9, 45)]
    public void Should_Fail_WhenNotAlignedToHalfHour(int hour, int minute)
    {
        CreateAppointmentCommand command = Command(new DateTime(2026, 9, 10, hour, minute, 0, DateTimeKind.Utc), 30);

        TestValidationResult<CreateAppointmentCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.StartsAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(20)]
    [InlineData(45)]
    public void Should_Fail_WhenDurationNotPositiveMultipleOf30(int durationMinutes)
    {
        CreateAppointmentCommand command = Command(new DateTime(2026, 9, 10, 9, 0, 0, DateTimeKind.Utc), durationMinutes);

        TestValidationResult<CreateAppointmentCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.DurationMinutes);
    }
}
