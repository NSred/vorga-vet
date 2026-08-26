using Application.Patients.Update;
using Domain.Patients;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Patients;

public sealed class UpdatePatientValidatorTests
{
    private readonly UpdatePatientCommandValidator _validator = new();

    private static UpdatePatientCommand ValidCommand() => new()
    {
        PatientId = Guid.NewGuid(),
        OwnerId = Guid.NewGuid(),
        BreedId = Guid.NewGuid(),
        CardNumber = "12345",
        Name = "Rex",
        Sex = Sex.Male
    };

    [Fact]
    public void Validator_Should_HaveError_WhenPatientIdIsEmpty()
    {
        UpdatePatientCommand command = ValidCommand();
        command.PatientId = Guid.Empty;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.PatientId);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenOwnerIdIsEmpty()
    {
        UpdatePatientCommand command = ValidCommand();
        command.OwnerId = Guid.Empty;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.OwnerId);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenBreedIdIsEmpty()
    {
        UpdatePatientCommand command = ValidCommand();
        command.BreedId = Guid.Empty;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.BreedId);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenCardNumberIsEmpty()
    {
        UpdatePatientCommand command = ValidCommand();
        command.CardNumber = string.Empty;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.CardNumber);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenNameIsEmpty()
    {
        UpdatePatientCommand command = ValidCommand();
        command.Name = string.Empty;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenSexIsNotAValidEnumValue()
    {
        UpdatePatientCommand command = ValidCommand();
        command.Sex = (Sex)999;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Sex);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenWeightKgIsZeroOrNegative()
    {
        UpdatePatientCommand command = ValidCommand();
        command.WeightKg = -1;

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.WeightKg);
    }

    [Fact]
    public void Validator_Should_HaveError_WhenBirthDateIsInTheFuture()
    {
        UpdatePatientCommand command = ValidCommand();
        command.BirthDate = DateTime.Today.AddDays(1);

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.BirthDate);
    }

    [Fact]
    public void Validator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        UpdatePatientCommand command = ValidCommand();

        TestValidationResult<UpdatePatientCommand> result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
