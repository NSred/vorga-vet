using FluentValidation;

namespace Application.Owners.Create;

public class CreateOwnerCommandValidator : AbstractValidator<CreateOwnerCommand>
{
    public CreateOwnerCommandValidator()
    {
        RuleFor(c => c.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(c => c.LastName).NotEmpty().MaximumLength(100);
        RuleFor(c => c.PhoneNumber).NotEmpty().MaximumLength(30);
        RuleFor(c => c.Address).NotEmpty().MaximumLength(200);
        RuleFor(c => c.City).NotEmpty().MaximumLength(100);
    }
}
