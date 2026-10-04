using Application.Patients.Create;
using Domain.Patients;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Patients;

public sealed class PatientValidatorsTests
{
    private readonly CreatePatientCommandValidator _createValidator = new();

    private static CreatePatientCommand ValidCommand() => new()
    {
        OwnerId = Guid.NewGuid(),
        BreedId = Guid.NewGuid(),
        CardNumber = "12345",
        Name = "Rex",
        Sex = Sex.Male
    };

    [Fact]
    public void CreateValidator_Should_HaveError_WhenOwnerIdIsEmpty()
    {
        CreatePatientCommand command = ValidCommand();
        command.OwnerId = Guid.Empty;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.OwnerId);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenBreedIdIsEmpty()
    {
        CreatePatientCommand command = ValidCommand();
        command.BreedId = Guid.Empty;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.BreedId);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenCardNumberIsEmpty()
    {
        CreatePatientCommand command = ValidCommand();
        command.CardNumber = string.Empty;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.CardNumber);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenNameIsEmpty()
    {
        CreatePatientCommand command = ValidCommand();
        command.Name = string.Empty;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenSexIsNotAValidEnumValue()
    {
        CreatePatientCommand command = ValidCommand();
        command.Sex = (Sex)999;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Sex);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenWeightKgIsZeroOrNegative()
    {
        CreatePatientCommand command = ValidCommand();
        command.WeightKg = 0;

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.WeightKg);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenBirthDateIsInTheFuture()
    {
        CreatePatientCommand command = ValidCommand();
        command.BirthDate = DateTime.Today.AddDays(1);

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.BirthDate);
    }

    [Fact]
    public void CreateValidator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        CreatePatientCommand command = ValidCommand();

        TestValidationResult<CreatePatientCommand> result = _createValidator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
