using Application.Abstractions.Messaging;
using Domain.Breeds;

namespace Application.Breeds.Create;

public sealed class CreateBreedCommand : ICommand<Guid>
{
    public string Name { get; set; }
    public Species Species { get; set; }
}
