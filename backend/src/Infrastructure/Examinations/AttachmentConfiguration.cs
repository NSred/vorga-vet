using Domain.Examinations;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Examinations;

internal sealed class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.FileName).HasMaxLength(260);
        builder.Property(a => a.ContentType).HasMaxLength(100);
        builder.Property(a => a.StorageKey).HasMaxLength(500);

        builder.HasIndex(a => a.ExaminationId);
        builder.HasIndex(a => a.PatientId);

        // Deleting an examination is not a use case; if it ever becomes one, its images go with it.
        builder.HasOne<Examination>().WithMany().HasForeignKey(a => a.ExaminationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Patient>().WithMany().HasForeignKey(a => a.PatientId).OnDelete(DeleteBehavior.Restrict);
    }
}
