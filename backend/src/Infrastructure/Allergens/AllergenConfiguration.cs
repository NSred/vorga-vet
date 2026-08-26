using Domain.Allergens;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Allergens;

internal sealed class AllergenConfiguration : IEntityTypeConfiguration<Allergen>
{
    public void Configure(EntityTypeBuilder<Allergen> builder)
    {
        builder.HasKey(a => a.Id);

        builder.HasIndex(a => a.Name).HasMethod("gin").HasOperators("gin_trgm_ops");
    }
}
