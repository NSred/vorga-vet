using Domain.Users;

namespace Application.Abstractions.Authentication;

public interface IUserContext
{
    Guid UserId { get; }

    Role Role { get; }
}
