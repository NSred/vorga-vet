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

    // Optional link to a login. Null for the many owners who never have an account;
    // set only by an invite or a vet linking an existing record. Unique when present.
    public Guid? UserId { get; private set; }

    // The deduplication key. Nullable (a phone booking may have none), unique when
    // present, stored lower-cased so uniqueness is case-insensitive.
    public string? Email { get; private set; }

    private Owner() { } // EF Core

    public static Owner Create(
        string firstName,
        string lastName,
        string phoneNumber,
        string address,
        string city,
        string? email = null)
    {
        var owner = new Owner
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            Address = address,
            City = city,
            Email = NormalizeEmail(email)
        };

        owner.Raise(new OwnerCreatedDomainEvent(owner.Id));

        return owner;
    }

    public void LinkToUser(Guid userId)
    {
        UserId = userId;
    }

    [System.Diagnostics.CodeAnalysis.SuppressMessage(
        "Globalization",
        "CA1308:Normalize strings to uppercase",
        Justification = "Emails are stored lower-cased for display and case-insensitive uniqueness.")]
    public static string? NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
}
