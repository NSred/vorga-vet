namespace Application.Appointments.GetAvailability;

public sealed class AvailabilitySlotResponse
{
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }

    /// <summary>Whether an appointment of the requested duration can start in this slot.</summary>
    public bool IsAvailable { get; set; }

    /// <summary>Whether the caller's own booking covers this slot — never anyone else's.</summary>
    public bool IsMine { get; set; }
}
