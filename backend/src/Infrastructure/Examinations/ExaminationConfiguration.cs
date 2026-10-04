using Domain.Appointments;
using Domain.Examinations;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Examinations;

internal sealed class ExaminationConfiguration : IEntityTypeConfiguration<Examination>
{
    public void Configure(EntityTypeBuilder<Examination> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Cost).HasPrecision(10, 2);

        // One examination per appointment; walk-ins (null) don't collide with each other.
        builder.HasIndex(e => e.AppointmentId).IsUnique().HasFilter("\"appointment_id\" IS NOT NULL");
        builder.HasIndex(e => e.PatientId);

        builder.HasOne<Patient>().WithMany().HasForeignKey(e => e.PatientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Appointment>().WithMany().HasForeignKey(e => e.AppointmentId).OnDelete(DeleteBehavior.Restrict);
    }
}
