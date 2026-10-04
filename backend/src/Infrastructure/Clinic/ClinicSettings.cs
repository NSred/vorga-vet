using Application.Abstractions.Clinic;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Clinic;

internal sealed class ClinicSettings : IClinicSettings
{
    private const string DefaultTimeZoneId = "Europe/Belgrade";

    private readonly HashSet<string> _veterinarianEmails;

    public ClinicSettings(IConfiguration configuration)
    {
        string timeZoneId = configuration["Clinic:TimeZone"] ?? DefaultTimeZoneId;

        TimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);

        string[] emails = configuration.GetSection("Clinic:VeterinarianEmails").Get<string[]>() ?? [];

        _veterinarianEmails = new HashSet<string>(
            emails.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => e.Trim()),
            StringComparer.OrdinalIgnoreCase);
    }

    public TimeZoneInfo TimeZone { get; }

    public bool IsVeterinarianEmail(string email) => _veterinarianEmails.Contains(email.Trim());
}
