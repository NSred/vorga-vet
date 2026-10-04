using Application.Patients.Delete;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Patients;

public sealed class DeletePatientValidatorTests
{
    private readonly DeletePatientCommandValidator _validator = new();

    [Fact]
    public void Validator_Should_HaveError_WhenPatientIdIsEmpty()
    {
        var command = new DeletePatientCommand(Guid.Empty);

        TestValidationResult<DeletePatientCommand> result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.PatientId);
    }

    [Fact]
    public void Validator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        var command = new DeletePatientCommand(Guid.NewGuid());

        TestValidationResult<DeletePatientCommand> result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
