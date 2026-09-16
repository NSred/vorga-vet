using Domain.Clinic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Clinic;

internal sealed class ClinicScheduleConfiguration : IEntityTypeConfiguration<ClinicSchedule>
{
    public void Configure(EntityTypeBuilder<ClinicSchedule> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.DayOfWeek).IsUnique();

        // Seed one row per weekday, 07:00-20:00 open, matching the Day view's assumed hours.
        // Fixed ids so the seed is deterministic across migrations; edit hours via the clinic settings later.
        builder.HasData(
            Seed("a0000000-0000-0000-0000-000000000000", DayOfWeek.Sunday),
            Seed("a0000000-0000-0000-0000-000000000001", DayOfWeek.Monday),
            Seed("a0000000-0000-0000-0000-000000000002", DayOfWeek.Tuesday),
            Seed("a0000000-0000-0000-0000-000000000003", DayOfWeek.Wednesday),
            Seed("a0000000-0000-0000-0000-000000000004", DayOfWeek.Thursday),
            Seed("a0000000-0000-0000-0000-000000000005", DayOfWeek.Friday),
            Seed("a0000000-0000-0000-0000-000000000006", DayOfWeek.Saturday));
    }

    private static object Seed(string id, DayOfWeek dayOfWeek) => new
    {
        Id = Guid.Parse(id),
        DayOfWeek = dayOfWeek,
        OpenTime = new TimeOnly(7, 0),
        CloseTime = new TimeOnly(20, 0),
        IsClosed = false
    };
}
