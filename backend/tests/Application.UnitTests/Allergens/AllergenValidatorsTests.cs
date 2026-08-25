using Application.Allergens.Create;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Allergens;

public sealed class AllergenValidatorsTests
{
    private readonly CreateAllergenCommandValidator _createValidator = new();

    [Fact]
    public void CreateValidator_Should_HaveError_WhenNameIsEmpty()
    {
        var command = new CreateAllergenCommand { Name = string.Empty };

        TestValidationResult<CreateAllergenCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void CreateValidator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        var command = new CreateAllergenCommand { Name = "Chicken protein" };

        TestValidationResult<CreateAllergenCommand> result = _createValidator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
