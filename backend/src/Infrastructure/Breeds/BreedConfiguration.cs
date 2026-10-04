using Domain.Breeds;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Breeds;

internal sealed class BreedConfiguration : IEntityTypeConfiguration<Breed>
{
    public void Configure(EntityTypeBuilder<Breed> builder)
    {
        builder.HasKey(b => b.Id);

        builder.HasIndex(b => b.Name).HasMethod("gin").HasOperators("gin_trgm_ops");
    }
}
