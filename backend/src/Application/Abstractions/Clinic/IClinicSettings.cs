namespace Application.Abstractions.Clinic;

/// <summary>
/// Clinic-wide settings that aren't per-row data. The timezone is what turns the local
/// opening hours in <c>ClinicSchedule</c> into the UTC instants appointments are stored in.
/// </summary>
public interface IClinicSettings
{
    TimeZoneInfo TimeZone { get; }

    /// <summary>
    /// Whether an email belongs to the clinic's veterinarian account(s). Configuration is the
    /// only way an account gets the vet role — there is no endpoint for it — so promotion is
    /// an operator decision, applied at registration and healed at login.
    /// </summary>
    bool IsVeterinarianEmail(string email);
}
