using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Breeds;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Breeds.Create;

internal sealed class CreateBreedCommandHandler(IApplicationDbContext context)
    : ICommandHandler<CreateBreedCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateBreedCommand command, CancellationToken cancellationToken)
    {
        string name = command.Name.Trim();

        Breed? existingBreed = await context.Breeds
            .FirstOrDefaultAsync(
                b => b.Species == command.Species && EF.Functions.ILike(b.Name, name),
                cancellationToken);

        if (existingBreed is not null)
        {
            return existingBreed.Id;
        }

        var breed = Breed.Create(name, command.Species);

        context.Breeds.Add(breed);

        await context.SaveChangesAsync(cancellationToken);

        return breed.Id;
    }
}
