using Domain.Owners;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Owners;

internal sealed class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.HasKey(o => o.Id);

        // Optional 1:1 link to a login, and the deduplication key — both unique only
        // where present, so the many account-less / email-less owners don't collide.
        builder.HasIndex(o => o.UserId).IsUnique().HasFilter("\"user_id\" IS NOT NULL");
        builder.HasIndex(o => o.Email).IsUnique().HasFilter("\"email\" IS NOT NULL");

        builder.HasOne<Domain.Users.User>().WithMany().HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(o => o.FirstName).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.LastName).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.PhoneNumber).HasMethod("gin").HasOperators("gin_trgm_ops");
        builder.HasIndex(o => o.Address).HasMethod("gin").HasOperators("gin_trgm_ops");
    }
}
