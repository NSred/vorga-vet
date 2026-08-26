using Domain.Owners;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Owners;

internal sealed class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.HasKey(o => o.Id);

        builder.HasIndex(o => o.FirstName).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.LastName).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.PhoneNumber).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.Address).HasMethod("gin").HasOperators("gin_trgm_ops");
    }
}
