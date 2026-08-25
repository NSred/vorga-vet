using Application.Abstractions.Messaging;

namespace Application.Owners.Create;

public sealed class CreateOwnerCommand : ICommand<Guid>
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PhoneNumber { get; set; }
    public string Address { get; set; }
    public string City { get; set; }
}
