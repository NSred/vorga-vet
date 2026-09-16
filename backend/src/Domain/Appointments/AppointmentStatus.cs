namespace Domain.Appointments;

public enum AppointmentStatus
{
    // Values 0 and 1 are the "active" statuses that hold the slot — the overlap
    // exclusion constraint filters on `status IN (0, 1)`. Keep them at 0/1.
    Scheduled = 0,
    CheckedIn = 1,
    Completed = 2,
    NoShow = 3,
    Cancelled = 4
}
