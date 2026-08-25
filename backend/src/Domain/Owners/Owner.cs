using SharedKernel;

namespace Domain.Owners;

public sealed class Owner : Entity
{
    public Guid Id { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }
    public string City { get; private set; }

    private Owner() { } // EF Core

    public static Owner Create(string firstName, string lastName, string phoneNumber, string address, string city)
    {
        var owner = new Owner
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            Address = address,
            City = city
        };

        owner.Raise(new OwnerCreatedDomainEvent(owner.Id));

        return owner;
    }
}
