using Application.Abstractions.Clinic;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Clinic;

internal sealed class ClinicSettings : IClinicSettings
{
    private const string DefaultTimeZoneId = "Europe/Belgrade";

    public ClinicSettings(IConfiguration configuration)
    {
        string timeZoneId = configuration["Clinic:TimeZone"] ?? DefaultTimeZoneId;

        TimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
    }

    public TimeZoneInfo TimeZone { get; }
}
