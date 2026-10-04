namespace Application.Abstractions.Authentication;

/// <summary>
/// Named authorization policies. Endpoint-level access is role-based (two coarse roles);
/// row-level scoping for clients happens inside the handlers via <see cref="IUserContext.Role"/>.
/// </summary>
public static class Policies
{
    public const string Veterinarian = "Veterinarian";
}
