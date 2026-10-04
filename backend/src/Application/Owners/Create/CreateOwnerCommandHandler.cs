using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Owners;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Owners.Create;

internal sealed class CreateOwnerCommandHandler(IApplicationDbContext context)
    : ICommandHandler<CreateOwnerCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateOwnerCommand command, CancellationToken cancellationToken)
    {
        string? normalizedEmail = Owner.NormalizeEmail(command.Email);

        if (normalizedEmail is not null)
        {
            bool emailTaken = await context.Owners
                .AnyAsync(o => o.Email == normalizedEmail, cancellationToken);

            if (emailTaken)
            {
                return Result.Failure<Guid>(OwnerErrors.EmailNotUnique);
            }
        }

        var owner = Owner.Create(
            command.FirstName,
            command.LastName,
            command.PhoneNumber,
            command.Address,
            command.City,
            command.Email);

        context.Owners.Add(owner);

        await context.SaveChangesAsync(cancellationToken);

        return owner.Id;
    }
}
