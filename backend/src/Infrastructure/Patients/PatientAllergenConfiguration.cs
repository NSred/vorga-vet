using Domain.Allergens;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Patients;

internal sealed class PatientAllergenConfiguration : IEntityTypeConfiguration<PatientAllergen>
{
    public void Configure(EntityTypeBuilder<PatientAllergen> builder)
    {
        builder.HasKey(pa => pa.Id);

        builder.HasIndex(pa => new { pa.PatientId, pa.AllergenId }).IsUnique();

        builder.HasOne<Patient>().WithMany().HasForeignKey(pa => pa.PatientId);
        builder.HasOne<Allergen>().WithMany().HasForeignKey(pa => pa.AllergenId);
    }
}
