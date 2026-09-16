using Domain.Appointments;

namespace Application.Appointments;

public sealed class AppointmentResponse
{
    public Guid Id { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? OwnerId { get; set; }
    public Guid? PatientId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public int DurationMinutes { get; set; }
    public AppointmentType Type { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? Reason { get; set; }
    public string? OwnerName { get; set; }
    public string? PatientName { get; set; }
    public DateTime CreatedAt { get; set; }
}
