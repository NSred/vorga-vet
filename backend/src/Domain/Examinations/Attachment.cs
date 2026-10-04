using SharedKernel;

namespace Domain.Examinations;

/// <summary>
/// An X-ray or ultrasound image taken during an examination. Always belongs to an examination
/// (no orphan branch); the patient id is kept alongside so "every scan for this animal" is
/// one index scan rather than a join. The bytes live behind <c>StorageKey</c>.
/// </summary>
public sealed class Attachment : Entity
{
    public Guid Id { get; private set; }
    public Guid ExaminationId { get; private set; }
    public Guid PatientId { get; private set; }
    public AttachmentKind Kind { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public long SizeBytes { get; private set; }
    public string StorageKey { get; private set; }
    public DateTime UploadedAt { get; private set; }

    private Attachment() { } // EF Core

    public static Attachment Create(
        Guid examinationId,
        Guid patientId,
        AttachmentKind kind,
        string fileName,
        string contentType,
        long sizeBytes,
        string storageKey,
        DateTime uploadedAtUtc)
    {
        return new Attachment
        {
            Id = Guid.NewGuid(),
            ExaminationId = examinationId,
            PatientId = patientId,
            Kind = kind,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            StorageKey = storageKey,
            UploadedAt = uploadedAtUtc
        };
    }
}
