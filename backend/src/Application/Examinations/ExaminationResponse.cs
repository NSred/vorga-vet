namespace Application.Examinations;

public sealed class ExaminationResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string? PatientName { get; set; }
    public Guid? AppointmentId { get; set; }
    public string PerformedByFirstName { get; set; } = string.Empty;
    public string PerformedByLastName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? Anamnesis { get; set; }
    public string? Diagnosis { get; set; }
    public string? Therapy { get; set; }
    public decimal? Cost { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AttachmentResponse> Attachments { get; set; } = [];
}
