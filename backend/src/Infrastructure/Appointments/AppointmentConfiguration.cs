using Domain.Appointments;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Appointments;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(a => a.Id);

        // Range queries scan by time; client scoping filters by owner.
        builder.HasIndex(a => a.StartsAt);
        builder.HasIndex(a => a.OwnerId);

        builder.HasOne<Owner>().WithMany().HasForeignKey(a => a.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Patient>().WithMany().HasForeignKey(a => a.PatientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(a => a.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);

        // The ClosedByUserId FK is added in the lifecycle step, with that field.

        // The one-appointment-per-slot invariant is a partial range-exclusion constraint,
        // which EF Core cannot express fluently — it is added as raw SQL in the migration
        // (ck_appointments_no_overlap: EXCLUDE gist tstzrange(starts_at, ends_at) WHERE active).
    }
}
