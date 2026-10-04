using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Allergens;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Allergens.Create;

internal sealed class CreateAllergenCommandHandler(IApplicationDbContext context)
    : ICommandHandler<CreateAllergenCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateAllergenCommand command, CancellationToken cancellationToken)
    {
        string name = command.Name.Trim();

        Allergen? existingAllergen = await context.Allergens
            .FirstOrDefaultAsync(a => EF.Functions.ILike(a.Name, name), cancellationToken);

        if (existingAllergen is not null)
        {
            return existingAllergen.Id;
        }

        var allergen = Allergen.Create(name);

        context.Allergens.Add(allergen);

        await context.SaveChangesAsync(cancellationToken);

        return allergen.Id;
    }
}
