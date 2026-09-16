using System.Security.Claims;
using Domain.Users;

namespace Infrastructure.Authentication;

internal static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal? principal)
    {
        string? userId = principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(userId, out Guid parsedUserId) ?
            parsedUserId :
            throw new ApplicationException("User id is unavailable");
    }

    public static Role GetRole(this ClaimsPrincipal? principal)
    {
        // The JWT carries a short "role" claim; depending on inbound claim mapping it may be
        // surfaced under either that name or the ClaimTypes.Role URI, so check both.
        string? role = principal?.FindFirstValue("role") ?? principal?.FindFirstValue(ClaimTypes.Role);

        return Enum.TryParse(role, out Role parsedRole) ?
            parsedRole :
            throw new ApplicationException("User role is unavailable");
    }
}
