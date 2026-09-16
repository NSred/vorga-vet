namespace Domain.Appointments;

/// <summary>
/// The single source of truth for which status changes are allowed. Handlers call
/// <see cref="CanTransition"/> and return <see cref="AppointmentErrors.InvalidTransition"/>
/// on a false, keeping the rule in the domain while the entity's mutators stay void
/// (matching the repo's handler-guards / entity-mutates split).
/// </summary>
public static class AppointmentStatusTransitions
{
    public static bool CanTransition(AppointmentStatus from, AppointmentStatus to) => (from, to) switch
    {
        (AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn) => true,
        (AppointmentStatus.Scheduled, AppointmentStatus.Completed) => true,
        (AppointmentStatus.Scheduled, AppointmentStatus.NoShow) => true,
        (AppointmentStatus.Scheduled, AppointmentStatus.Cancelled) => true,
        (AppointmentStatus.CheckedIn, AppointmentStatus.Completed) => true,
        (AppointmentStatus.CheckedIn, AppointmentStatus.Cancelled) => true,
        _ => false
    };
}
