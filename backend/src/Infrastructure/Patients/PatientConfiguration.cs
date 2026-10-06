using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Patients;

internal sealed class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.HasKey(p => p.Id);

        // birth_date is timestamptz, but a birthday arrives as a bare "2021-08-10" and lands as
        // Kind=Unspecified, which Npgsql refuses. It is a calendar date, so read it as UTC midnight.
        builder.Property(p => p.BirthDate)
            .HasConversion(
                d => d != null ? DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : d,
                v => v);

        builder.HasIndex(p => p.CardNumber).IsUnique();

        builder.HasIndex(p => p.Name).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(p => p.ChipNumber).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(p => p.Anamnesis).HasMethod("gin").HasOperators("gin_trgm_ops");

        builder.HasOne<Owner>().WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Breed>().WithMany().HasForeignKey(p => p.BreedId).OnDelete(DeleteBehavior.Restrict);
    }
}
