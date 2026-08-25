using Application.Owners.Create;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Owners;

public sealed class OwnerValidatorsTests
{
    private readonly CreateOwnerCommandValidator _createValidator = new();

    private static CreateOwnerCommand ValidCommand() => new()
    {
        FirstName = "Ana",
        LastName = "Petrović",
        PhoneNumber = "064/1234567",
        Address = "Zmaj Jovina 4",
        City = "Novi Sad"
    };

    [Fact]
    public void CreateValidator_Should_HaveError_WhenFirstNameIsEmpty()
    {
        CreateOwnerCommand command = ValidCommand();
        command.FirstName = string.Empty;

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.FirstName);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenLastNameIsEmpty()
    {
        CreateOwnerCommand command = ValidCommand();
        command.LastName = string.Empty;

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.LastName);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenPhoneNumberIsEmpty()
    {
        CreateOwnerCommand command = ValidCommand();
        command.PhoneNumber = string.Empty;

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.PhoneNumber);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenAddressIsEmpty()
    {
        CreateOwnerCommand command = ValidCommand();
        command.Address = string.Empty;

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Address);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenCityIsEmpty()
    {
        CreateOwnerCommand command = ValidCommand();
        command.City = string.Empty;

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.City);
    }

    [Fact]
    public void CreateValidator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        CreateOwnerCommand command = ValidCommand();

        TestValidationResult<CreateOwnerCommand> result = _createValidator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
