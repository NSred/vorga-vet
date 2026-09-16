using SharedKernel;

namespace Domain.Clinic;

/// <summary>
/// One row per weekday describing when the clinic is open. Availability generation
/// reads these rows; there is no per-date exception model yet (holidays, lunch breaks
/// are a later addition to this same table).
/// </summary>
public sealed class ClinicSchedule : Entity
{
    public Guid Id { get; private set; }
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly OpenTime { get; private set; }
    public TimeOnly CloseTime { get; private set; }
    public bool IsClosed { get; private set; }

    private ClinicSchedule() { } // EF Core

    public static ClinicSchedule Create(DayOfWeek dayOfWeek, TimeOnly openTime, TimeOnly closeTime, bool isClosed)
    {
        return new ClinicSchedule
        {
            Id = Guid.NewGuid(),
            DayOfWeek = dayOfWeek,
            OpenTime = openTime,
            CloseTime = closeTime,
            IsClosed = isClosed
        };
    }

    public void UpdateHours(TimeOnly openTime, TimeOnly closeTime, bool isClosed)
    {
        OpenTime = openTime;
        CloseTime = closeTime;
        IsClosed = isClosed;
    }
}
