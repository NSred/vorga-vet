using SharedKernel;

namespace Domain.Appointments;

public static class AppointmentErrors
{
    public static Error NotFound(Guid appointmentId) => Error.NotFound(
        "Appointments.NotFound",
        $"The appointment with the Id = '{appointmentId}' was not found");

    public static readonly Error SlotTaken = Error.Conflict(
        "Appointments.SlotTaken",
        "That time overlaps an appointment that is already booked");

    public static Error InvalidTransition(AppointmentStatus from, AppointmentStatus to) => Error.Problem(
        "Appointments.InvalidTransition",
        $"An appointment cannot move from '{from}' to '{to}'");

    public static readonly Error SurgeryRequiresVeterinarian = Error.Problem(
        "Appointments.SurgeryRequiresVeterinarian",
        "Only a veterinarian can schedule a surgery");

    public static readonly Error InvalidDuration = Error.Problem(
        "Appointments.InvalidDuration",
        "Only a surgery may run longer than 30 minutes; every other appointment is 30 minutes");

    public static readonly Error PatientDoesNotBelongToOwner = Error.Problem(
        "Appointments.PatientDoesNotBelongToOwner",
        "The selected patient does not belong to the appointment's owner");

    public static readonly Error InvalidRange = Error.Problem(
        "Appointments.InvalidRange",
        "The 'to' date must be after the 'from' date");

    public static readonly Error RangeTooWide = Error.Problem(
        "Appointments.RangeTooWide",
        "The requested date range is too large; request a narrower window");
}
