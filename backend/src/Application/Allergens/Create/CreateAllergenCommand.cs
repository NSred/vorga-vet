using Application.Abstractions.Messaging;

namespace Application.Allergens.Create;

public sealed class CreateAllergenCommand : ICommand<Guid>
{
    public string Name { get; set; }
}
