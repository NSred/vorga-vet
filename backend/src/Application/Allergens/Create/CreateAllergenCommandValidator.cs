using FluentValidation;

namespace Application.Allergens.Create;

public class CreateAllergenCommandValidator : AbstractValidator<CreateAllergenCommand>
{
    public CreateAllergenCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(100);
    }
}
