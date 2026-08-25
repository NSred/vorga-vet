using Application.Breeds.Create;
using Domain.Breeds;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Breeds;

public sealed class BreedValidatorsTests
{
    private readonly CreateBreedCommandValidator _createValidator = new();

    [Fact]
    public void CreateValidator_Should_HaveError_WhenNameIsEmpty()
    {
        var command = new CreateBreedCommand { Name = string.Empty, Species = Species.Dog };

        TestValidationResult<CreateBreedCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void CreateValidator_Should_HaveError_WhenSpeciesIsNotAValidEnumValue()
    {
        var command = new CreateBreedCommand { Name = "Labrador", Species = (Species)999 };

        TestValidationResult<CreateBreedCommand> result = _createValidator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Species);
    }

    [Fact]
    public void CreateValidator_Should_NotHaveErrors_WhenCommandIsValid()
    {
        var command = new CreateBreedCommand { Name = "Labrador", Species = Species.Dog };

        TestValidationResult<CreateBreedCommand> result = _createValidator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
