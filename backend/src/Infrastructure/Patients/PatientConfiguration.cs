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

        builder.HasIndex(p => p.CardNumber).IsUnique();

        builder.HasIndex(p => p.Name).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(p => p.ChipNumber).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(p => p.Anamnesis).HasMethod("gin").HasOperators("gin_trgm_ops");

        builder.HasOne<Owner>().WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Breed>().WithMany().HasForeignKey(p => p.BreedId).OnDelete(DeleteBehavior.Restrict);
    }
}
