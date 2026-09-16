using Application.Abstractions.Authentication;
using Domain.Users;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Authentication;

internal sealed class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId =>
        _httpContextAccessor
            .HttpContext?
            .User
            .GetUserId() ??
        throw new UserContextUnavailableException();

    public Role Role =>
        _httpContextAccessor
            .HttpContext?
            .User
            .GetRole() ??
        throw new UserContextUnavailableException();
}
