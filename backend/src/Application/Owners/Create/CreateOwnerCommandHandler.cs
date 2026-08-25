using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Owners;
using SharedKernel;

namespace Application.Owners.Create;

internal sealed class CreateOwnerCommandHandler(IApplicationDbContext context)
    : ICommandHandler<CreateOwnerCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateOwnerCommand command, CancellationToken cancellationToken)
    {
        var owner = Owner.Create(
            command.FirstName,
            command.LastName,
            command.PhoneNumber,
            command.Address,
            command.City);

        context.Owners.Add(owner);

        await context.SaveChangesAsync(cancellationToken);

        return owner.Id;
    }
}
