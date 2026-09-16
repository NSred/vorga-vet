namespace Application.Abstractions.Clinic;

/// <summary>
/// Clinic-wide settings that aren't per-row data. The timezone is what turns the local
/// opening hours in <c>ClinicSchedule</c> into the UTC instants appointments are stored in.
/// </summary>
public interface IClinicSettings
{
    TimeZoneInfo TimeZone { get; }
}
